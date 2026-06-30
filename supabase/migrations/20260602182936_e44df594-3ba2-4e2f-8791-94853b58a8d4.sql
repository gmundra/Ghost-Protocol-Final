
-- DROPS
CREATE TABLE public.drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  cover_image text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  stock integer NOT NULL DEFAULT 0,
  drop_number integer,
  release_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.drops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drops TO authenticated;
GRANT ALL ON public.drops TO service_role;

ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live drops"
  ON public.drops FOR SELECT
  TO anon, authenticated
  USING (status IN ('live', 'archived', 'sold_out'));

CREATE POLICY "Authenticated full read"
  ON public.drops FOR SELECT
  TO authenticated USING (true);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('GP-' || to_char(now(),'YYMMDD') || '-' || substr(md5(random()::text),1,6)),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL,
  subtotal integer NOT NULL,
  shipping integer NOT NULL DEFAULT 0,
  total integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read orders"
  ON public.orders FOR SELECT TO authenticated USING (true);

-- NOTIFY SIGNUPS
CREATE TABLE public.notify_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT 'home',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT INSERT ON public.notify_signups TO anon;
GRANT SELECT, INSERT, DELETE ON public.notify_signups TO authenticated;
GRANT ALL ON public.notify_signups TO service_role;

ALTER TABLE public.notify_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can signup"
  ON public.notify_signups FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read signups"
  ON public.notify_signups FOR SELECT TO authenticated USING (true);

-- SITE CONFIG
CREATE TABLE public.site_config (
  id integer PRIMARY KEY DEFAULT 1,
  hero_video_url text,
  hero_headline text DEFAULT 'MOVE IN SILENCE',
  hero_subtext text DEFAULT 'The Ghost Protocol — Drops from the underground.',
  manifesto text DEFAULT 'WE DO NOT EXIST FOR THE MASSES. WE MOVE IN SILENCE. WE LEAVE NO TRACE. THE GHOST PROTOCOL IS NOT A BRAND — IT IS A SIGNAL.',
  next_drop_date timestamptz,
  behold_widget_id text,
  instagram_url text DEFAULT 'https://instagram.com/theghostprotocol',
  whatsapp_number text DEFAULT '919799355370',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT ON public.site_config TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read config"
  ON public.site_config FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated update config"
  ON public.site_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.site_config (id, next_drop_date)
VALUES (1, now() + interval '14 days');

-- Seed a few demo drops
INSERT INTO public.drops (slug, name, tagline, description, price, cover_image, sizes, status, is_featured, stock, drop_number, release_date) VALUES
('phantom-hoodie-001', 'PHANTOM HOODIE', 'Black on black. No logo. Pure presence.', 'Heavyweight 450 GSM cotton fleece. Boxed cut. Reflective ghost mark on the back panel.', 349900, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200', '["S","M","L","XL"]'::jsonb, 'live', true, 24, 1, now() - interval '2 days'),
('signal-tee-002', 'SIGNAL TEE', 'Transmit nothing. Receive everything.', '220 GSM organic cotton. Heavy oversized fit. Distressed graphic on chest.', 189900, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200', '["S","M","L","XL","XXL"]'::jsonb, 'live', false, 40, 2, now() - interval '5 days'),
('protocol-cargo-003', 'PROTOCOL CARGO', 'Built for the night shift.', 'Heavy ripstop cotton. Multi-pocket utility. Tapered leg.', 489900, 'https://images.unsplash.com/photo-1473966968600-fa801b3a3f64?w=1200', '["28","30","32","34","36"]'::jsonb, 'live', false, 18, 3, now() - interval '8 days'),
('ghost-mask-archive-01', 'GHOST MASK', 'Archive 01 — sold out.', 'The piece that started it all.', 249900, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', '["OS"]'::jsonb, 'archived', false, 0, 0, now() - interval '180 days');
