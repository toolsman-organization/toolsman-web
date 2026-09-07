import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types/database';

/**
 * Fetch all active categories (both main categories and subcategories).
 */
export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Categories] getActiveCategories:', error);
    return [];
  }
  return (data ?? []) as Category[];
}

/**
 * Fetch only active top-level Main Categories (parent_id IS NULL).
 */
export async function getMainCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Categories] getMainCategories:', error);
    return [];
  }
  return (data ?? []) as Category[];
}

/**
 * Fetch full active category tree (Main Categories with their active Subcategories).
 */
export async function getCategoryTree(): Promise<Category[]> {
  const allActive = await getActiveCategories();
  
  const mainCategories = allActive.filter((c) => !c.parent_id);
  const subcategories = allActive.filter((c) => Boolean(c.parent_id));

  return mainCategories.map((main) => ({
    ...main,
    subcategories: subcategories.filter((sub) => sub.parent_id === main.id),
  }));
}

/**
 * Fetch single category by slug, including its parent and child subcategories if applicable.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  const category = data as Category;

  // If this is a subcategory, fetch parent
  if (category.parent_id) {
    const { data: parentData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', category.parent_id)
      .single();
    if (parentData) {
      category.parent = parentData as Category;
    }
  } else {
    // If this is a main category, fetch subcategories
    const { data: subData } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    category.subcategories = (subData ?? []) as Category[];
  }

  return category;
}

/**
 * Admin: Get all categories (both main and sub, active and inactive) with parent metadata.
 */
export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Categories] getAllCategoriesAdmin:', error);
    return [];
  }
  return (data ?? []) as Category[];
}

/**
 * Check if a category has child subcategories (for safe deletion).
 */
export async function checkCategoryHasSubcategories(categoryId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', categoryId);

  if (error) {
    console.error('[Categories] checkCategoryHasSubcategories:', error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Check if a category has assigned products (for safe deletion).
 */
export async function checkCategoryHasProducts(categoryId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    console.error('[Categories] checkCategoryHasProducts:', error);
    return 0;
  }
  return count ?? 0;
}

