import { createClient } from '@/lib/supabase/server';
import type { AnnouncementBar } from '@/types/database';

const DEFAULT_ANNOUNCEMENTS: AnnouncementBar[] = [
  {
    id: 'default-1',
    message: '🚚 Express Delivery Across Kerala | 100% Genuine Branded Tools',
    link_text: 'Shop Now',
    link_url: '/shop',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    message: '⚡ Heavy-Duty Power Tools, Machinery & Genuine Spare Parts',
    link_text: 'Explore Catalog',
    link_url: '/shop',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getActiveAnnouncements(): Promise<AnnouncementBar[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('announcement_bars')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_ANNOUNCEMENTS;
    }
    return data as AnnouncementBar[];
  } catch {
    return DEFAULT_ANNOUNCEMENTS;
  }
}

export async function getAllAnnouncementsAdmin(): Promise<AnnouncementBar[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('announcement_bars')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      return DEFAULT_ANNOUNCEMENTS;
    }
    return data as AnnouncementBar[];
  } catch {
    return DEFAULT_ANNOUNCEMENTS;
  }
}
