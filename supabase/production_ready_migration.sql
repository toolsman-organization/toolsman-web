-- ============================================================
-- TOOLSMAN — Production Master Migration & Verification Script
-- Safe & Idempotent (Can be run on fresh DB or existing DB)
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFILES TABLE & AUTH TRIGGER
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. CATEGORIES (With Hierarchical parent_id)
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 5. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCTS (With weight & included_components)
CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  sku                 TEXT UNIQUE,
  short_description   TEXT,
  description         TEXT,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id            UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  original_price      NUMERIC(10,2) NOT NULL,
  selling_price       NUMERIC(10,2) NOT NULL,
  stock_quantity      INTEGER NOT NULL DEFAULT 0,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS included_components TEXT;

-- 7. PRODUCT IMAGES & SPECIFICATIONS
CREATE TABLE IF NOT EXISTS public.product_images (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url             TEXT NOT NULL,
  cloudinary_public_id  TEXT,
  alt_text              TEXT,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_specifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_name   TEXT NOT NULL,
  spec_value  TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- 8. BANNERS & ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  link_url    TEXT,
  badge_text  TEXT,
  position    TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'promo', 'sidebar')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_bars (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message     TEXT NOT NULL,
  link_text   TEXT,
  link_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  role        TEXT,
  comment     TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  verified    BOOLEAN NOT NULL DEFAULT TRUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CUSTOMER ADDRESSES & COUPONS
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  district      TEXT NOT NULL,
  state         TEXT NOT NULL DEFAULT 'Kerala',
  pincode       TEXT NOT NULL,
  landmark      TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  usage_limit     INTEGER,
  used_count      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ORDERS & ORDER ITEMS (Updated check constraints & indexes)
CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number          TEXT NOT NULL UNIQUE,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  shipping_address      JSONB NOT NULL,
  subtotal_amount       NUMERIC(10,2) NOT NULL,
  delivery_charge       NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code           TEXT,
  discount_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(10,2) NOT NULL,
  payment_method        TEXT NOT NULL DEFAULT 'razorpay' CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status        TEXT NOT NULL DEFAULT 'pending',
  order_status          TEXT NOT NULL DEFAULT 'awaiting_payment',
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update check constraints safely
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('pending', 'awaiting_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  unit_price    NUMERIC(10,2) NOT NULL,
  quantity      INTEGER NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT NOT NULL,
  notes       TEXT,
  changed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. WISHLIST, CART & SETTINGS
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  delivery_charge         NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC(10,2) NOT NULL DEFAULT 0,
  cod_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  support_phone           TEXT NOT NULL DEFAULT '+91 98765 43210',
  support_email           TEXT NOT NULL DEFAULT 'support@toolsman.in',
  store_address           TEXT NOT NULL DEFAULT 'Toolsman Store, Kerala, India',
  whatsapp_number         TEXT NOT NULL DEFAULT '+919876543210',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 13. MASTER VIEW: product_with_details
DROP VIEW IF EXISTS public.product_with_details CASCADE;
CREATE OR REPLACE VIEW public.product_with_details AS
SELECT
  p.*,
  pi.image_url AS primary_image_url,
  pi.cloudinary_public_id AS primary_image_cloudinary_id,
  pi.alt_text AS primary_image_alt,
  c.name AS category_name,
  c.slug AS category_slug,
  c.parent_id AS category_parent_id,
  pc.id AS parent_category_id,
  pc.name AS parent_category_name,
  pc.slug AS parent_category_slug,
  b.name AS brand_name,
  b.slug AS brand_slug,
  b.logo_url AS brand_logo_url,
  CASE
    WHEN p.original_price > 0 AND p.selling_price < p.original_price
    THEN ROUND(((p.original_price - p.selling_price) / p.original_price * 100)::numeric, 0)
    ELSE 0
  END AS discount_percentage
FROM public.products p
LEFT JOIN public.product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN public.categories pc ON pc.id = c.parent_id
LEFT JOIN public.brands b ON b.id = p.brand_id;

GRANT SELECT ON public.product_with_details TO anon, authenticated, service_role;

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view product specifications" ON public.product_specifications;
CREATE POLICY "Public can view product specifications" ON public.product_specifications FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcement_bars;
CREATE POLICY "Public can view active announcements" ON public.announcement_bars FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view active testimonials" ON public.testimonials;
CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (TRUE);

-- User-scoped policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- Admin full access policies
DROP POLICY IF EXISTS "Admins full access to categories" ON public.categories;
CREATE POLICY "Admins full access to categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to brands" ON public.brands;
CREATE POLICY "Admins full access to brands" ON public.brands FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to products" ON public.products;
CREATE POLICY "Admins full access to products" ON public.products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to product images" ON public.product_images;
CREATE POLICY "Admins full access to product images" ON public.product_images FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to product specifications" ON public.product_specifications;
CREATE POLICY "Admins full access to product specifications" ON public.product_specifications FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to banners" ON public.banners;
CREATE POLICY "Admins full access to banners" ON public.banners FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to announcement bars" ON public.announcement_bars;
CREATE POLICY "Admins full access to announcement bars" ON public.announcement_bars FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to testimonials" ON public.testimonials;
CREATE POLICY "Admins full access to testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to coupons" ON public.coupons;
CREATE POLICY "Admins full access to coupons" ON public.coupons FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to orders" ON public.orders;
CREATE POLICY "Admins full access to orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to order items" ON public.order_items;
CREATE POLICY "Admins full access to order items" ON public.order_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to order status history" ON public.order_status_history;
CREATE POLICY "Admins full access to order status history" ON public.order_status_history FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
CREATE POLICY "Admins full access to profiles" ON public.profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to site settings" ON public.site_settings;
CREATE POLICY "Admins full access to site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- 15. ENABLE REALTIME FOR ORDERS (Admin Live Order Notification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
