import { createClient } from '@/lib/supabase/server';
import type { ProductWithDetails, ProductFullDetail, ProductFilters, PaginatedResult } from '@/types/database';

export async function getFeaturedProducts(limit = 8): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('[Products] getFeaturedProducts:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

export async function getBestSellerProducts(limit = 8): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('[Products] getBestSellerProducts:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

export async function getNewArrivalProducts(limit = 8): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('[Products] getNewArrivalProducts:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

export async function getProductBySlug(slug: string): Promise<ProductFullDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      brand:brands(*),
      images:product_images(*),
      specifications:product_specifications(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) { return null; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = data as any;
  const rawImages = (product.images || []) as Array<{ id: string; is_primary: boolean; image_url: string; sort_order: number }>;
  const sortedImages = rawImages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryImage = sortedImages.find((img) => img.is_primary) || sortedImages[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSpecs = (product.specifications || []) as any[];
  const sortedSpecs = rawSpecs.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const origPrice = Number(product.original_price) || 0;
  const sellPrice = Number(product.selling_price) || 0;

  return {
    ...product,
    images: sortedImages,
    specifications: sortedSpecs,
    primary_image_url: primaryImage?.image_url ?? null,
    discount_percentage:
      origPrice > 0 && sellPrice < origPrice
        ? Math.round(((origPrice - sellPrice) / origPrice) * 100)
        : 0,
  } as ProductFullDetail;
}

export async function getProductsByCategory(categorySlug: string, limit = 8): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .eq('category_slug', categorySlug)
    .limit(limit);

  if (error) { console.error('[Products] getProductsByCategory:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  let query = supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .neq('id', productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) { console.error('[Products] getRelatedProducts:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

export async function getProducts(
  filters: ProductFilters,
  page = 1,
  limit = 12
): Promise<PaginatedResult<ProductWithDetails>> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('product_with_details')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (filters.category) query = query.eq('category_slug', filters.category);
  if (filters.brand) query = query.eq('brand_slug', filters.brand);
  if (filters.minPrice !== undefined) query = query.gte('selling_price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('selling_price', filters.maxPrice);
  if (filters.inStock) query = query.gt('stock_quantity', 0);
  if (filters.featured) query = query.eq('is_featured', true);
  if (filters.bestSeller) query = query.eq('is_best_seller', true);
  if (filters.isNew) query = query.eq('is_new', true);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%,brand_name.ilike.%${filters.search}%,category_name.ilike.%${filters.search}%`
    );
  }

  switch (filters.sort) {
    case 'price-low':  query = query.order('selling_price', { ascending: true }); break;
    case 'price-high': query = query.order('selling_price', { ascending: false }); break;
    case 'newest':     query = query.order('created_at', { ascending: false }); break;
    case 'popular':    query = query.order('is_best_seller', { ascending: false }); break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) { console.error('[Products] getProducts:', error); }

  const total = count ?? 0;
  return {
    data: (data ?? []) as ProductWithDetails[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function searchProducts(query: string, limit = 10): Promise<ProductWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_with_details')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,product_code.ilike.%${query}%,brand_name.ilike.%${query}%`)
    .limit(limit);

  if (error) { console.error('[Products] searchProducts:', error); return []; }
  return (data ?? []) as ProductWithDetails[];
}

// Admin: get all products including inactive
export async function getAllProductsAdmin(page = 1, limit = 20, search?: string) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('product_with_details')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { console.error('[Products] getAllProductsAdmin:', error); }
  return { data: (data ?? []) as ProductWithDetails[], total: count ?? 0 };
}
