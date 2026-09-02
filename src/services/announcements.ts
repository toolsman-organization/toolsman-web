import { createClient } from '@/lib/supabase/server';
import type { AnnouncementBar } from '@/types/database';

export async function getActiveAnnouncements(): Promise<AnnouncementBar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcement_bars')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Announcements] getActiveAnnouncements:', error); return []; }
  return (data ?? []) as AnnouncementBar[];
}

export async function getAllAnnouncementsAdmin(): Promise<AnnouncementBar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcement_bars')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('[Announcements] getAllAnnouncementsAdmin:', error); return []; }
  return (data ?? []) as AnnouncementBar[];
}
