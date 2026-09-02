import { createClient } from '@/lib/supabase/server';
import type { Banner } from '@/types/database';

export async function getActiveBanners(position: 'hero' | 'promo' | 'sidebar' = 'hero'): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('position', position)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Banners] getActiveBanners:', error); return []; }
  return (data ?? []) as Banner[];
}

export async function getAllBannersAdmin(): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Banners] getAllBannersAdmin:', error); return []; }
  return (data ?? []) as Banner[];
}
