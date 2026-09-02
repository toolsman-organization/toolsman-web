-- ============================================================
-- TOOLSMAN — Complete Supabase Database Schema
-- Run this entire file in Supabase SQL Editor on a fresh project.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 2. CORE TABLE: PROFILES (Must exist before is_admin function)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. ALL OTHER TABLES
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  description          TEXT,
  image_url            TEXT,
  cloudinary_public_id TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  logo_url             TEXT,
  cloudinary_public_id TEXT,
  description          TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code      TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description       TEXT,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id          UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  original_price    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (original_price >= 0),
  selling_price     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  stock_quantity    INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller    BOOLEAN NOT NULL DEFAULT FALSE,
  is_new            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url            TEXT NOT NULL,
  cloudinary_public_id TEXT,
  alt_text             TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  is_primary           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Specifications
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  specification_name   TEXT NOT NULL,
  specification_value  TEXT NOT NULL,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                       TEXT,
  subtitle                    TEXT,
  image_url                   TEXT NOT NULL,
  cloudinary_public_id        TEXT,
  mobile_image_url            TEXT,
  mobile_cloudinary_public_id TEXT,
  button_text                 TEXT,
  button_link                 TEXT,
  position                    TEXT NOT NULL DEFAULT 'hero' CHECK (position IN ('hero', 'promo', 'sidebar')),
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  start_date                  TIMESTAMPTZ,
  end_date                    TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcement Bars
CREATE TABLE IF NOT EXISTS public.announcement_bars (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message    TEXT NOT NULL,
  link_text  TEXT,
  link_url   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city           TEXT NOT NULL,
  district       TEXT,
  state          TEXT NOT NULL DEFAULT 'Kerala',
  pincode        TEXT NOT NULL,
  landmark       TEXT,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  TEXT NOT NULL UNIQUE,
  description           TEXT,
  discount_type         TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value        NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  minimum_order_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  maximum_discount      NUMERIC(10,2),
  usage_limit           INTEGER,
  used_count            INTEGER NOT NULL DEFAULT 0,
  start_date            TIMESTAMPTZ,
  end_date              TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number         TEXT NOT NULL UNIQUE DEFAULT '',
  user_id              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name        TEXT NOT NULL,
  customer_phone       TEXT NOT NULL,
  customer_email       TEXT,
  shipping_address     JSONB NOT NULL DEFAULT '{}',
  subtotal             NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code          TEXT,
  payment_method       TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status       TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  order_status         TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled')),
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  razorpay_signature   TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  image_url    TEXT,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price  NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key   TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON public.brands(is_active);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON public.products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON public.products(selling_price);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(product_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON public.product_specifications(product_id);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);

CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcement_bars(is_active);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.customer_addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);

-- ============================================================
-- 6. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_banners_updated_at ON public.banners;
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcement_bars;
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcement_bars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_str TEXT;
  seq_num   INTEGER;
  order_num TEXT;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD');

  SELECT COUNT(*) + 1
  INTO seq_num
  FROM public.orders
  WHERE TO_CHAR(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') = today_str;

  order_num := 'TM-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN order_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number = '' OR NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_number ON public.orders;
CREATE TRIGGER trg_orders_set_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

CREATE OR REPLACE FUNCTION public.record_initial_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, status, note, changed_by)
  VALUES (NEW.id, NEW.order_status, 'Order placed', NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_initial_status ON public.orders;
CREATE TRIGGER trg_orders_initial_status AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_initial_order_status();

CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.order_status_history (order_id, status, note, changed_by)
    VALUES (NEW.id, NEW.order_status, NULL, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_change ON public.orders;
CREATE TRIGGER trg_orders_status_change AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.record_order_status_change();

-- ============================================================
-- 7. CONVENIENCE VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.product_with_details AS
SELECT
  p.*,
  pi.image_url AS primary_image_url,
  pi.cloudinary_public_id AS primary_image_cloudinary_id,
  pi.alt_text AS primary_image_alt,
  c.name AS category_name,
  c.slug AS category_slug,
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
LEFT JOIN public.brands b ON b.id = p.brand_id;

-- ============================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_bars     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings         ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Categories & Brands Policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active brands" ON public.brands;
CREATE POLICY "Anyone can view active brands" ON public.brands FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view product specs" ON public.product_specifications;
CREATE POLICY "Anyone can view product specs" ON public.product_specifications FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage product specs" ON public.product_specifications;
CREATE POLICY "Admins can manage product specs" ON public.product_specifications FOR ALL USING (public.is_admin());

-- Marketing Policies
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcement_bars;
CREATE POLICY "Anyone can view active announcements" ON public.announcement_bars FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcement_bars;
CREATE POLICY "Admins can manage announcements" ON public.announcement_bars FOR ALL USING (public.is_admin());

-- Customer Addresses, Coupons, Settings Policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = TRUE OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "System can insert order items" ON public.order_items;
CREATE POLICY "System can insert order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own order status history" ON public.order_status_history;
CREATE POLICY "Users can view own order status history" ON public.order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
DROP POLICY IF EXISTS "System can insert status history" ON public.order_status_history;
CREATE POLICY "System can insert status history" ON public.order_status_history FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 9. INITIAL SEED DATA
-- ============================================================

-- Site Settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('store_name',            'TOOLSMAN'),
  ('store_tagline',         'Built for the Job. Professional Tools. Serious Performance.'),
  ('store_phone',           '+91 79944 10167'),
  ('store_email',           'info@toolsman.in'),
  ('store_address',         'Tirur, Puthanathani, Malappuram, Kerala - 676552'),
  ('free_shipping_above',   '999'),
  ('shipping_charge',       '99'),
  ('cod_enabled',           'true'),
  ('currency_symbol',       '₹'),
  ('currency_code',         'INR'),
  ('meta_title',            'TOOLSMAN — Professional Power Tools Store Kerala'),
  ('meta_description',      'Buy genuine power tools, hand tools, machinery and accessories at TOOLSMAN. Fast doorstep delivery across Kerala.'),
  ('social_facebook',       ''),
  ('social_instagram',      ''),
  ('social_youtube',        ''),
  ('whatsapp_number',       '+917994410167')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Categories
INSERT INTO public.categories (id, name, slug, description, sort_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Drills & Drivers',     'drills-drivers',      'Corded and cordless drill drivers, impact drills', 1, TRUE),
  ('11111111-1111-1111-1111-111111111102', 'Angle Grinders',       'angle-grinders',      'Angle grinders for cutting and grinding steel & masonry', 2, TRUE),
  ('11111111-1111-1111-1111-111111111103', 'Rotary Hammers',       'rotary-hammers',      'Heavy-duty SDS Plus & SDS Max rotary hammers', 3, TRUE),
  ('11111111-1111-1111-1111-111111111104', 'Cutting Tools',        'cutting-tools',       'Circular saws, jigsaws, miter saws', 4, TRUE),
  ('11111111-1111-1111-1111-111111111105', 'Hand Tools',           'hand-tools',          'Spanners, pliers, toolsets, socket wrenches', 5, TRUE),
  ('11111111-1111-1111-1111-111111111106', 'Accessories & Spares', 'accessories',         'Cutting discs, drill bits, carbon brushes', 6, TRUE),
  ('11111111-1111-1111-1111-111111111107', 'Batteries & Chargers', 'batteries-chargers',  '20V lithium-ion batteries and fast chargers', 7, TRUE),
  ('11111111-1111-1111-1111-111111111108', 'Impact Wrenches',      'impact-wrenches',     'High-torque cordless brushless impact wrenches', 8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Brands
INSERT INTO public.brands (id, name, slug, description, sort_order, is_active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'INGCO',        'ingco',        'Quality power tools at competitive prices', 1, TRUE),
  ('22222222-2222-2222-2222-222222222202', 'Bosch',        'bosch',        'German engineering precision and durability', 2, TRUE),
  ('22222222-2222-2222-2222-222222222203', 'Makita',       'makita',       'Professional contractor power tools', 3, TRUE),
  ('22222222-2222-2222-2222-222222222204', 'DeWalt',       'dewalt',       'Guaranteed Tough heavy-duty jobsite equipment', 4, TRUE),
  ('22222222-2222-2222-2222-222222222205', 'Stanley',      'stanley',      'Hand tools and measuring instruments', 5, TRUE),
  ('22222222-2222-2222-2222-222222222206', 'Total',        'total',        'Total industrial tools for every trade', 6, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Announcement Tickers
INSERT INTO public.announcement_bars (message, link_text, link_url, sort_order, is_active) VALUES
  ('🚚 Fast Doorstep Delivery Across Kerala', NULL, NULL, 1, TRUE),
  ('✅ 100% Genuine Brand Warranty on All Power Tools', NULL, NULL, 2, TRUE),
  ('🛡️ FREE Delivery on Orders Above ₹999', 'Shop Deals', '/shop', 3, TRUE),
  ('📞 Tool Servicing & Spare Parts Available', 'Contact Desk', '/shop', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, is_active) VALUES
  ('KERALA10', 'Flat 10% discount on power tools for Kerala contractors', 'percentage', 10, 999, 500, TRUE),
  ('TOOLSMAN500', 'Flat ₹500 off on high-value orders above ₹4,999', 'fixed', 500, 4999, 500, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Sample Products
INSERT INTO public.products (
  id, product_code, name, slug, short_description, description,
  category_id, brand_id, original_price, selling_price, stock_quantity,
  is_active, is_featured, is_best_seller, is_new
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'CAGLI21154',
    'INGCO 20V Brushless Angle Grinder 115mm',
    'ingco-20v-brushless-angle-grinder',
    'High-power 20V brushless angle grinder with safety paddle switch and spindle lock.',
    'Heavy-duty industrial grade cordless angle grinder powered by high-efficiency brushless motor. Ideal for metal cutting, weld cleanup, and masonry grinding. 2-Year brushless motor warranty included.',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222201',
    4799, 4199, 15, TRUE, TRUE, TRUE, FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'CDLI20024',
    'INGCO 20V Cordless Impact Drill Driver 13mm',
    'ingco-20v-cordless-impact-drill-driver',
    '2-Speed variable cordless impact drill driver with 45Nm maximum torque.',
    'Versatile hammer drill driver equipped with LED worklight, 13mm keyless metal chuck, and 20+1 torque settings for precision drilling into wood, steel, and masonry.',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    3899, 3499, 20, TRUE, TRUE, TRUE, FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    'GBH-220',
    'Bosch 720W SDS Plus Rotary Hammer GBH 220',
    'bosch-720w-sds-plus-rotary-hammer-gbh-220',
    'Compact and powerful 720W rotary hammer with 2.0 Joules impact energy.',
    'Original Bosch professional rotary hammer offering 3-mode operation (drilling, hammer drilling, and chiseling). High impact rate for effortless drilling into hard concrete.',
    '11111111-1111-1111-1111-111111111103',
    '22222222-2222-2222-2222-222222222202',
    6499, 5899, 8, TRUE, TRUE, TRUE, FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    'DCD796D2',
    'DeWalt 18V XR Brushless Compact Hammer Drill',
    'dewalt-18v-xr-brushless-compact-hammer-drill',
    'Heavy-duty XR Brushless technology with 70Nm torque and metal chuck.',
    'Jobsite proven DeWalt XR compact combi drill. Includes intelligent trigger, steel belt hook, and magnetic bit holder. Extreme runtime for construction applications.',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222204',
    14999, 12999, 5, TRUE, TRUE, FALSE, TRUE
  )
ON CONFLICT (product_code) DO NOTHING;

-- Specifications for Sample Products
INSERT INTO public.product_specifications (product_id, specification_name, specification_value, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Voltage', '20V DC', 1),
  ('33333333-3333-3333-3333-333333333301', 'Motor Type', 'Brushless', 2),
  ('33333333-3333-3333-3333-333333333301', 'Disc Diameter', '115 mm (4-1/2")', 3),
  ('33333333-3333-3333-3333-333333333301', 'No Load Speed', '3000 / 8500 RPM', 4),
  ('33333333-3333-3333-3333-333333333301', 'Spindle Thread', 'M14', 5),

  ('33333333-3333-3333-3333-333333333302', 'Voltage', '20V DC', 1),
  ('33333333-3333-3333-3333-333333333302', 'Max Torque', '45 Nm', 2),
  ('33333333-3333-3333-3333-333333333302', 'Chuck Capacity', '0.8 - 10 mm Keyless', 3),
  ('33333333-3333-3333-3333-333333333302', 'Torque Settings', '15 + 1', 4),

  ('33333333-3333-3333-3333-333333333303', 'Rated Power', '720 Watts', 1),
  ('33333333-3333-3333-3333-333333333303', 'Impact Energy', '2.0 Joules', 2),
  ('33333333-3333-3333-3333-333333333303', 'Drilling Dia. Concrete', '4 - 22 mm', 3),
  ('33333333-3333-3333-3333-333333333303', 'Tool Holder', 'SDS Plus', 4)
ON CONFLICT DO NOTHING;
