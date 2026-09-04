-- ============================================================
-- Migration: Add weight and included_components to Products
-- Description: Adds optional fields 'weight' and 'included_components'
--              to public.products and refreshes product_with_details view.
-- ============================================================

-- 1. Add columns to the products table (if they don't already exist)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS included_components TEXT;

-- 2. Add column comments for documentation
COMMENT ON COLUMN public.products.weight IS 'Optional item weight (e.g. 2.4 kg, 850 g)';
COMMENT ON COLUMN public.products.included_components IS 'Optional included package components / in-the-box accessories';

-- 3. Recreate the product_with_details view so it includes the new columns
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

-- 4. Grant SELECT permissions on the view to public and authenticated roles
GRANT SELECT ON public.product_with_details TO anon, authenticated, service_role;
