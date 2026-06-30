-- ============================================================
-- Ghost Protocol Foundry — Live Schema Reconciliation
--
-- The two earlier migrations in this folder (20260602182936,
-- 20260603122052) are from an older export and are now stale —
-- the live, connected Supabase project has evolved well past them.
-- This migration captures that evolution so a fresh database
-- (e.g. via `supabase db reset`) ends up matching the live schema
-- exactly. It is purely additive; nothing here drops or alters
-- anything destructively.
--
-- RLS policies below are derived from how the actual frontend code
-- talks to each table/bucket (verified by reading every call site),
-- not assumed:
--   - drops, site_config, configurator_assets: read directly by
--     anon everywhere (customer pages AND the admin panel itself,
--     which runs as anon and filters client-side)
--   - orders, admin_secrets: touched ONLY by service-role Edge
--     Functions (admin-api, razorpay-create-order,
--     razorpay-verify-payment) — never queried directly by the
--     client — so anon/authenticated get no direct access at all
--   - notify_signups: anon INSERT only (the signup form); reads go
--     through admin-api with service role
--   - storage 'ghost-media': anon needs INSERT (both the public
--     configurator AND the admin upload UI use the same anon-context
--     upload helper) and SELECT (signed URL generation respects RLS);
--     DELETE goes through admin-api with service role, so anon gets
--     no delete policy
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── admin_secrets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_secrets (
  id integer PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_secrets_single_row CHECK (id = 1)
);

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies at all — only the admin-api Edge
-- Function (service_role) ever reads or writes this table.

-- Seed with a default code. CHANGE THIS before going live — rotate
-- it from Admin → Settings, which calls admin-api's rotate_code op.
-- Default below hashes to the SHA-256 of "ghostprotocol2024" — replace immediately.
INSERT INTO public.admin_secrets (id, password_hash)
VALUES (1, encode(digest('ghostprotocol2024', 'sha256'), 'hex'))
ON CONFLICT (id) DO NOTHING;

-- ── configurator_assets ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configurator_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_name text NOT NULL,
  garment_color text NOT NULL,
  color_hex text,
  front_preview_url text,
  back_preview_url text,
  active_status boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configurator_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active configurator assets"
  ON public.configurator_assets FOR SELECT
  TO anon, authenticated
  USING (active_status = true);
-- Writes happen only via admin-api (service_role) — no anon write policy.

-- ── drops: live-only columns ───────────────────────────────────
ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS size_chart_url text,
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- drops is read directly by anon everywhere, INCLUDING the admin
-- panel (which is anon + a client-side code gate, not Supabase Auth),
-- and the admin panel needs to see draft/archived rows too — so the
-- read policy intentionally does not filter by status.
DROP POLICY IF EXISTS "Public can read live drops" ON public.drops;
CREATE POLICY "Anon read all drops"
  ON public.drops FOR SELECT
  TO anon, authenticated
  USING (true);
-- Writes (upsert_drop, delete_drop) happen only via admin-api (service_role).

-- ── orders: live-only columns ───────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS production_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS artwork_url text,
  ADD COLUMN IF NOT EXISTS mockup_url text,
  ADD COLUMN IF NOT EXISTS config_json jsonb,
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- orders is touched only by service-role Edge Functions in the live
-- app — the client never queries it directly — so no anon/authenticated
-- policies are added here. The original "Anyone can create orders" /
-- "Authenticated read orders" policies from the old migration still
-- exist underneath; they're simply unused by current code paths and
-- are left as-is rather than dropped, in case something still relies on them.

-- ── site_config: live-only columns ──────────────────────────────
ALTER TABLE public.site_config
  ADD COLUMN IF NOT EXISTS configurator_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS configurator_sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS configurator_size_chart_url text,
  ADD COLUMN IF NOT EXISTS production_email text NOT NULL DEFAULT 'fits.ghost.protocol@gmail.com',
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS hero_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hero_cta_href text,
  ADD COLUMN IF NOT EXISTS hero_cta_label text,
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#e31313',
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#000000';

-- The admin_password column (raw SHA-256-in-site_config scheme) was
-- superseded by the admin_secrets table above and no longer exists
-- on the live project. Drop it here too if it's still present from
-- an older local migration run.
ALTER TABLE public.site_config DROP COLUMN IF EXISTS admin_password;

DROP POLICY IF EXISTS "Authenticated update config" ON public.site_config;
DROP POLICY IF EXISTS "Anon and authenticated update config" ON public.site_config;
-- site_config writes happen only via admin-api (service_role) on the
-- live app. The original anon/authenticated SELECT policy from the
-- old migration is left in place — site_config is read directly by
-- anon everywhere (Home, Configurator, Admin).

-- ── storage: ghost-media bucket ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ghost-media',
  'ghost-media',
  false, -- PRIVATE bucket — every read goes through a signed URL (see src/lib/storage.ts)
  20971520, -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY IF NOT EXISTS "Anon read ghost-media for signing"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ghost-media');

CREATE POLICY IF NOT EXISTS "Anon upload ghost-media"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'ghost-media');
-- Deletes go only through admin-api (delete_media op, service_role) —
-- no anon/authenticated DELETE policy is added.

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS orders_production_status_idx ON public.orders (production_status);
CREATE INDEX IF NOT EXISTS configurator_assets_active_idx ON public.configurator_assets (active_status, sort_order);
