import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/types/database';

/**
 * Get active testimonials for the storefront.
 */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Testimonials] getActiveTestimonials:', error);
    return [];
  }
  return (data ?? []) as Testimonial[];
}

/**
 * Get all testimonials for the admin panel.
 */
export async function getAllTestimonialsAdmin(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Testimonials] getAllTestimonialsAdmin:', error);
    return [];
  }
  return (data ?? []) as Testimonial[];
}
