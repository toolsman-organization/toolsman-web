-- ============================================================
-- TOOLSMAN — Complete Hierarchical Category System Migration & Cleanup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Add parent_id column (Self-referencing foreign key for Main Category -> Subcategory)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT;

-- Step 2: Create index on parent_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Step 3: Clear old category links from products (sets to NULL safely so products are preserved)
UPDATE public.products SET category_id = NULL;

-- Step 4: Remove all old flat category records to start fresh
DELETE FROM public.categories;

-- Step 5: Drop existing view so column list can be safely updated
DROP VIEW IF EXISTS public.product_with_details CASCADE;

-- Step 6: Recreate product_with_details view with parent category info
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
