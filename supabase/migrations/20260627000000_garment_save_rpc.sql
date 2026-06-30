-- ============================================================
-- Ghost Protocol Foundry — Garment Save: deployment-independent RPC
--
-- Root cause of "Edge Function returned a non-2xx status code" on
-- every Garments Save: the print-area drag handler in
-- PrintAreaEditor.tsx produces fractional percentages (derived from
-- pixel deltas), but configurator_assets.print_area_x/y/width/height
-- are `integer`. A fractional value passed through admin-api's
-- generic update()/insert() gets rejected by Postgres.
--
-- The frontend now rounds defensively at every input (see
-- PrintAreaEditor.tsx and Admin.tsx changes), but this migration adds
-- a second, independent layer: the actual write now goes through this
-- function instead of admin-api's generic passthrough op. Every
-- numeric field is explicitly cast via `round(...::numeric)::integer`
-- here, so the save is correct regardless of what the frontend sends —
-- and, like run_order_cleanup() before it, this works without any
-- Edge Function deployment at all, which is currently blocked.
--
-- NOTE: digest() lives in the `extensions` schema on Supabase, not
-- `public` — this function's SET search_path = public would otherwise
-- silently fail to find it. Confirmed live (the first draft of this
-- function errored with "function digest(text, unknown) does not
-- exist" until the call was schema-qualified as extensions.digest()).
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_garment_asset(code text, asset jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
  computed_hash text;
  result_row configurator_assets;
  asset_id uuid;
BEGIN
  SELECT password_hash INTO stored_hash FROM admin_secrets WHERE id = 1;
  computed_hash := encode(extensions.digest(code, 'sha256'), 'hex');
  IF stored_hash IS NULL OR computed_hash <> stored_hash THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  asset_id := NULLIF(asset->>'id', '')::uuid;

  IF asset_id IS NOT NULL THEN
    UPDATE configurator_assets SET
      garment_name = asset->>'garment_name',
      garment_color = asset->>'garment_color',
      color_hex = asset->>'color_hex',
      front_preview_url = asset->>'front_preview_url',
      back_preview_url = asset->>'back_preview_url',
      active_status = COALESCE((asset->>'active_status')::boolean, true),
      sort_order = round(COALESCE((asset->>'sort_order')::numeric, 0))::integer,
      print_area_x = round(COALESCE((asset->>'print_area_x')::numeric, 30))::integer,
      print_area_y = round(COALESCE((asset->>'print_area_y')::numeric, 26))::integer,
      print_area_width = round(COALESCE((asset->>'print_area_width')::numeric, 40))::integer,
      print_area_height = round(COALESCE((asset->>'print_area_height')::numeric, 42))::integer,
      base_price = round(COALESCE((asset->>'base_price')::numeric, 249900))::integer,
      artwork_fee = round(COALESCE((asset->>'artwork_fee')::numeric, 60000))::integer,
      updated_at = now()
    WHERE id = asset_id
    RETURNING * INTO result_row;
  ELSE
    INSERT INTO configurator_assets (
      garment_name, garment_color, color_hex, front_preview_url, back_preview_url,
      active_status, sort_order, print_area_x, print_area_y, print_area_width, print_area_height,
      base_price, artwork_fee
    ) VALUES (
      asset->>'garment_name', asset->>'garment_color', asset->>'color_hex',
      asset->>'front_preview_url', asset->>'back_preview_url',
      COALESCE((asset->>'active_status')::boolean, true),
      round(COALESCE((asset->>'sort_order')::numeric, 0))::integer,
      round(COALESCE((asset->>'print_area_x')::numeric, 30))::integer,
      round(COALESCE((asset->>'print_area_y')::numeric, 26))::integer,
      round(COALESCE((asset->>'print_area_width')::numeric, 40))::integer,
      round(COALESCE((asset->>'print_area_height')::numeric, 42))::integer,
      round(COALESCE((asset->>'base_price')::numeric, 249900))::integer,
      round(COALESCE((asset->>'artwork_fee')::numeric, 60000))::integer
    )
    RETURNING * INTO result_row;
  END IF;

  RETURN jsonb_build_object('data', to_jsonb(result_row));
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_garment_asset(text, jsonb) TO anon, authenticated;
