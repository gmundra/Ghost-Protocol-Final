-- ============================================================
-- Ghost Protocol Foundry — Pricing, Shipping, Hero Video, Cleanup
--
-- This file reflects exactly what was applied directly against the
-- live database (verified via direct query access) after the version
-- originally drafted here turned out to need two corrections once
-- actually run against real Postgres:
--
--   1. `CREATE POLICY IF NOT EXISTS` is not valid PostgreSQL syntax
--      (confirmed live: ERROR 42601 syntax error at or near "NOT").
--      Replaced with the standard DROP POLICY IF EXISTS + CREATE POLICY
--      idiom throughout.
--
--   2. `total_display_price` was originally a GENERATED ALWAYS column.
--      A generated column can never appear in an UPDATE's column list —
--      and the admin UI's Save sends back the full object it loaded,
--      which includes this column once it exists. That combination is
--      the actual root cause of the "Edge Function returned a non-2xx
--      status code" error on every Garments save. Replaced with a
--      regular column kept in sync by a BEFORE INSERT/UPDATE trigger,
--      which gives the same "always correct, can't drift" guarantee
--      without that restriction.
--
-- It also replaces the original pg_cron → pg_net → HTTP → Edge Function
-- chain for scheduled cleanup with a direct call to a `run_order_cleanup`
-- Postgres function (SECURITY DEFINER), callable straight from the
-- frontend via `supabase.rpc()`. This was a deliberate redesign, not a
-- bug fix: the admin-api Edge Function this project's code was written
-- against could not actually be deployed (Lovable credits were
-- exhausted), so a mechanism that doesn't depend on Edge Function
-- deployment at all was used instead. It is simpler and has fewer
-- moving parts than the HTTP-based version regardless.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ════════════════════════════════════════════════════════════
-- ISSUE 3 — Configurator pricing, per garment/color variant
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.configurator_assets
  ADD COLUMN IF NOT EXISTS base_price   integer NOT NULL DEFAULT 249900,
  ADD COLUMN IF NOT EXISTS artwork_fee  integer NOT NULL DEFAULT 60000;

ALTER TABLE public.configurator_assets
  ADD CONSTRAINT configurator_assets_price_nonneg
    CHECK (base_price >= 0 AND artwork_fee >= 0);

-- Regular column + trigger, NOT GENERATED ALWAYS — see header note above.
ALTER TABLE public.configurator_assets
  ADD COLUMN IF NOT EXISTS total_display_price integer NOT NULL DEFAULT 309900;

CREATE OR REPLACE FUNCTION public.sync_total_display_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_display_price := NEW.base_price + NEW.artwork_fee;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS configurator_assets_sync_price ON public.configurator_assets;
CREATE TRIGGER configurator_assets_sync_price
  BEFORE INSERT OR UPDATE ON public.configurator_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_total_display_price();

UPDATE public.configurator_assets SET total_display_price = base_price + artwork_fee;

COMMENT ON COLUMN public.configurator_assets.base_price IS
  'Garment base price in paise, before any artwork fee';
COMMENT ON COLUMN public.configurator_assets.artwork_fee IS
  'Additional fee in paise applied only when the customer attaches artwork';
COMMENT ON COLUMN public.configurator_assets.total_display_price IS
  'Kept in sync by configurator_assets_sync_price trigger = base_price + artwork_fee. "Fully configured" preview price for admin — not the live conditional total.';

-- ════════════════════════════════════════════════════════════
-- ISSUE 4 — Free shipping system
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS free_shipping_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_message text NOT NULL DEFAULT 'FREE SHIPPING PAN-INDIA';

-- ════════════════════════════════════════════════════════════
-- ISSUE 5 — Hero video management
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS hero_video_filename text,
  ADD COLUMN IF NOT EXISTS hero_video_size bigint,
  ADD COLUMN IF NOT EXISTS hero_video_updated_at timestamptz;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-media', 'hero-media', false, 524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Anon read hero-media for signing" ON storage.objects;
CREATE POLICY "Anon read hero-media for signing"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'hero-media');

DROP POLICY IF EXISTS "Anon upload hero-media" ON storage.objects;
CREATE POLICY "Anon upload hero-media"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'hero-media');

DROP POLICY IF EXISTS "Anon delete hero-media" ON storage.objects;
CREATE POLICY "Anon delete hero-media"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'hero-media');

-- ════════════════════════════════════════════════════════════
-- ISSUE 6 — Automatic storage cleanup for fulfilled orders
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assets_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assets_deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_file_count integer;

ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS auto_cleanup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cleanup_delay_days integer NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS public.order_asset_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  storage_path text NOT NULL,
  deletion_result text NOT NULL, -- 'success' | 'failed' | 'skipped_not_found'
  deleted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_asset_deletions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_asset_deletions_order_idx ON public.order_asset_deletions (order_id);

CREATE TABLE IF NOT EXISTS public.order_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'skipped'
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_cleanup_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_cleanup_queue_due_idx ON public.order_cleanup_queue (status, scheduled_for);

-- "FULFILLED" doesn't exist as a status anywhere in this codebase — the
-- closest, and only, terminal-ish state is production_status = 'shipped'.
CREATE OR REPLACE FUNCTION public.schedule_order_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delay_days integer;
BEGIN
  IF NEW.production_status = 'shipped' AND COALESCE(OLD.production_status, '') <> 'shipped' THEN
    SELECT cleanup_delay_days INTO delay_days FROM public.site_config WHERE id = 1;
    delay_days := COALESCE(delay_days, 30);

    INSERT INTO public.order_cleanup_queue (order_id, scheduled_for)
    VALUES (NEW.id, now() + (delay_days || ' days')::interval)
    ON CONFLICT (order_id) DO UPDATE
      SET scheduled_for = EXCLUDED.scheduled_for, status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_schedule_cleanup ON public.orders;
CREATE TRIGGER orders_schedule_cleanup
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_order_cleanup();

-- The actual deletion logic, as a SECURITY DEFINER Postgres function
-- callable directly via `supabase.rpc('run_order_cleanup', { force })`.
-- No Edge Function involved at all — this is what makes the "RUN
-- CLEANUP NOW" admin button work without needing anything deployed.
--
-- Note: this deletes the storage.objects metadata row directly via SQL.
-- That removes the file from listings and signed-URL generation
-- immediately; actual backend byte reclamation in Supabase's storage
-- backend is handled by Supabase's own garbage collection, which is an
-- internal implementation detail outside what a SQL migration can
-- directly verify.
CREATE OR REPLACE FUNCTION public.run_order_cleanup(force boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auto_enabled boolean;
  due_row record;
  art_deleted integer;
  mock_deleted integer;
  deleted_count integer;
  total_processed integer := 0;
BEGIN
  IF NOT force THEN
    SELECT auto_cleanup_enabled INTO auto_enabled FROM site_config WHERE id = 1;
    IF auto_enabled = false THEN
      RETURN jsonb_build_object('skipped', true, 'reason', 'auto_cleanup_disabled', 'processed', 0);
    END IF;
  END IF;

  FOR due_row IN
    SELECT q.id AS queue_id, o.id AS order_id, o.artwork_url, o.mockup_url, o.assets_deleted
    FROM order_cleanup_queue q
    JOIN orders o ON o.id = q.order_id
    WHERE q.status = 'pending' AND q.scheduled_for <= now()
  LOOP
    IF due_row.assets_deleted THEN
      UPDATE order_cleanup_queue SET status = 'completed' WHERE id = due_row.queue_id;
      CONTINUE;
    END IF;

    deleted_count := 0;

    IF due_row.artwork_url IS NOT NULL AND due_row.artwork_url NOT LIKE 'http%' THEN
      DELETE FROM storage.objects WHERE bucket_id = 'ghost-media' AND name = due_row.artwork_url;
      GET DIAGNOSTICS art_deleted = ROW_COUNT;
      INSERT INTO order_asset_deletions (order_id, asset_name, storage_path, deletion_result)
        VALUES (due_row.order_id, 'artwork', due_row.artwork_url, CASE WHEN art_deleted > 0 THEN 'success' ELSE 'skipped_not_found' END);
      IF art_deleted > 0 THEN deleted_count := deleted_count + 1; END IF;
    END IF;

    IF due_row.mockup_url IS NOT NULL AND due_row.mockup_url NOT LIKE 'http%' THEN
      DELETE FROM storage.objects WHERE bucket_id = 'ghost-media' AND name = due_row.mockup_url;
      GET DIAGNOSTICS mock_deleted = ROW_COUNT;
      INSERT INTO order_asset_deletions (order_id, asset_name, storage_path, deletion_result)
        VALUES (due_row.order_id, 'mockup', due_row.mockup_url, CASE WHEN mock_deleted > 0 THEN 'success' ELSE 'skipped_not_found' END);
      IF mock_deleted > 0 THEN deleted_count := deleted_count + 1; END IF;
    END IF;

    UPDATE orders SET assets_deleted = true, assets_deleted_at = now(), deleted_file_count = deleted_count
      WHERE id = due_row.order_id;
    UPDATE order_cleanup_queue SET status = 'completed' WHERE id = due_row.queue_id;
    total_processed := total_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('processed', total_processed);
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_order_cleanup(boolean) TO anon, authenticated;

-- Best-effort daily automatic run, calling the RPC function directly —
-- no HTTP call, no app.settings.* configuration needed, unlike the
-- pg_net/Edge-Function approach this superseded.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'ghost-protocol-cleanup-fulfilled-orders',
    '0 3 * * *',
    $cron$ SELECT public.run_order_cleanup(false); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped (not available on this project): %', SQLERRM;
END $$;
