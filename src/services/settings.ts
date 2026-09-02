import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value');

  const defaults: SiteSettings = {
    store_name: 'TOOLSMAN',
    store_tagline: 'Built for the Job.',
    store_phone: '+91 79944 10167',
    store_email: 'info@toolsman.in',
    store_address: 'Kerala, India',
    free_shipping_above: '999',
    shipping_charge: '99',
    cod_enabled: 'true',
    cod_min_order: '0',
    cod_max_order: '50000',
    currency_symbol: '₹',
    currency_code: 'INR',
    meta_title: 'TOOLSMAN — Professional Power Tools',
    meta_description: 'Buy genuine power tools at TOOLSMAN.',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    whatsapp_number: '',
  };

  if (!data) return defaults;

  const settings = { ...defaults };
  for (const row of data) {
    settings[row.setting_key] = row.setting_value ?? '';
  }
  return settings;
}
