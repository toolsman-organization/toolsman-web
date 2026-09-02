-- ============================================================
-- TOOLSMAN — Optional Seed Data
-- Run AFTER schema.sql on a fresh project.
-- This adds demo categories, brands, and announcement bars
-- so the storefront has something to display out-of-the-box.
-- ============================================================

-- Demo Categories
INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Drills & Drivers',     'drills-drivers',      'Corded and cordless drills, screwdrivers', 1, TRUE),
  ('Angle Grinders',       'angle-grinders',      'Angle grinders for cutting and grinding',   2, TRUE),
  ('Rotary Hammers',       'rotary-hammers',      'Heavy-duty rotary hammer drills',           3, TRUE),
  ('Cutting Tools',        'cutting-tools',       'Circular saws, jigsaws, and blades',        4, TRUE),
  ('Hand Tools',           'hand-tools',          'Spanners, pliers, hammers, screwdrivers',   5, TRUE),
  ('Accessories',          'accessories',         'Blades, bits, discs, and more',             6, TRUE),
  ('Batteries & Chargers', 'batteries-chargers',  '20V lithium-ion batteries and fast chargers',7, TRUE),
  ('Impact Wrenches',      'impact-wrenches',     'High-torque impact wrenches',               8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Demo Brands
INSERT INTO public.brands (name, slug, description, sort_order, is_active) VALUES
  ('INGCO',          'ingco',          'Quality power tools at affordable prices', 1, TRUE),
  ('Bosch',          'bosch',          'German engineering excellence',            2, TRUE),
  ('Makita',         'makita',         'Professional grade power tools',           3, TRUE),
  ('DeWalt',         'dewalt',         'Guaranteed Tough — Built for professionals',4, TRUE),
  ('Stanley',        'stanley',        'Hand tools trusted worldwide',             5, TRUE),
  ('Black+Decker',   'black-decker',   'Power tools for home and garden',          6, TRUE),
  ('Total',          'total',          'Total tools for every job',                7, TRUE),
  ('Xtra-Power',     'xtra-power',     'Professional power tools brand',           8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Demo Announcement Bars
INSERT INTO public.announcement_bars (message, link_text, link_url, sort_order, is_active) VALUES
  ('🚚 Delivery Across Kerala', NULL, NULL, 1, TRUE),
  ('✅ 100% Genuine Products', NULL, NULL, 2, TRUE),
  ('🛡️ Free Delivery Above ₹999', 'Shop Now', '/shop', 3, TRUE),
  ('📞 After Sales Support', 'Contact Us', '/contact', 4, TRUE)
ON CONFLICT DO NOTHING;
