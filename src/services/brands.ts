import { createClient } from '@/lib/supabase/server';
import type { Brand } from '@/types/database';

export async function getActiveBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Brands] getActiveBrands:', error); return []; }
  return (data ?? []) as Brand[];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as Brand;
}

export async function getAllBrandsAdmin(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Brands] getAllBrandsAdmin:', error); return []; }
  return (data ?? []) as Brand[];
}
