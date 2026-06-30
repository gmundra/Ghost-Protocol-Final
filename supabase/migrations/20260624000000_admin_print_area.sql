-- ============================================================
-- Ghost Protocol Foundry — Admin-Managed Print Area
--
-- Adds four columns to configurator_assets so each garment/color
-- variant can store its own print-area rectangle (as percentages
-- of the garment image, matching how the configurator already
-- positions the print zone today).
--
-- Defaults are set to the exact values currently hardcoded in
-- ConfiguratorTerminal.tsx's inline style
-- (`top: 26%, left: 30%, right: 30%, bottom: 32%`, i.e.
-- x=30, y=26, width=100-30-30=40, height=100-26-32=42), so every
-- existing row — and the no-asset/SVG-fallback case in code —
-- renders in exactly the same position as before this migration.
--
-- INTEGER, not NUMERIC: PostgREST (which the Supabase JS client sits on
-- top of) serializes `numeric` columns as JSON STRINGS, not numbers, to
-- avoid floating-point precision loss. The print-area drag handler does
-- `existingValue + deltaPixelsAsPercent` — if existingValue arrived as
-- the string "30" instead of the number 30, that `+` becomes string
-- concatenation, not addition, silently corrupting the position the
-- first time someone drags an existing (DB-loaded) asset's print area.
-- The admin UI only ever stores whole percentages anyway, so integer
-- loses nothing and removes the bug at its source rather than requiring
-- every consumer of these columns to defensively coerce types.
--
-- Purely additive. No existing column, table, or row is altered
-- or removed.
-- ============================================================

ALTER TABLE public.configurator_assets
  ADD COLUMN IF NOT EXISTS print_area_x      integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS print_area_y      integer NOT NULL DEFAULT 26,
  ADD COLUMN IF NOT EXISTS print_area_width  integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS print_area_height integer NOT NULL DEFAULT 42;

COMMENT ON COLUMN public.configurator_assets.print_area_x IS
  'Print zone left edge, as % of garment image width (0-100)';
COMMENT ON COLUMN public.configurator_assets.print_area_y IS
  'Print zone top edge, as % of garment image height (0-100)';
COMMENT ON COLUMN public.configurator_assets.print_area_width IS
  'Print zone width, as % of garment image width (0-100)';
COMMENT ON COLUMN public.configurator_assets.print_area_height IS
  'Print zone height, as % of garment image height (0-100)';

-- Sanity bounds — keep the rectangle within the image and non-degenerate.
-- (Existing rows already satisfy this via the defaults above; this only
-- constrains future writes.)
ALTER TABLE public.configurator_assets
  ADD CONSTRAINT configurator_assets_print_area_bounds CHECK (
    print_area_x >= 0 AND print_area_x <= 100 AND
    print_area_y >= 0 AND print_area_y <= 100 AND
    print_area_width  > 0 AND print_area_width  <= 100 AND
    print_area_height > 0 AND print_area_height <= 100 AND
    (print_area_x + print_area_width)  <= 100 AND
    (print_area_y + print_area_height) <= 100
  );
