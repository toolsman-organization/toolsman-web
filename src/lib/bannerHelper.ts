import type { Banner } from '@/types/database';

export type BannerFeatureIcon =
  | 'shield'
  | 'wrench'
  | 'headphones'
  | 'truck'
  | 'award'
  | 'check'
  | 'star'
  | 'refresh'
  | 'zap'
  | 'clock'
  | 'package'
  | 'sparkles';

export interface SimpleBannerContent {
  badge?: string;
  badge_color?: string;
  line1_text?: string;
  line1_color?: string;
  line2_text?: string;
  line2_color?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  show_overlay?: boolean;
}

export const BANNER_COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Brand Orange', value: '#f97316' },
  { label: 'Amber Yellow', value: '#f59e0b' },
  { label: 'Emerald Green', value: '#10b981' },
  { label: 'Cyan Blue', value: '#06b6d4' },
  { label: 'Light Gray', value: '#e5e5e5' },
];

export const DEFAULT_BANNER_CONTENT: SimpleBannerContent = {
  badge: 'Professional Tools Store',
  badge_color: '#f97316',
  line1_text: 'BUILT FOR',
  line1_color: '#ffffff',
  line2_text: 'THE JOB.',
  line2_color: '#f97316',
  subtitle: 'Professional tools. Serious performance.',
  button_text: 'SHOP NOW',
  button_link: '/shop',
  show_overlay: true,
};

const JSON_PREFIX = '__BANNER_V2__:';
const SIMPLE_PREFIX = '__BANNER_SIMPLE__:';

/**
 * Safely parse a Banner record into SimpleBannerContent.
 */
export function parseBannerContent(banner: Partial<Banner> | null | undefined): SimpleBannerContent {
  if (!banner) return { ...DEFAULT_BANNER_CONTENT };

  // Check for simple JSON
  if (banner.subtitle && banner.subtitle.startsWith(SIMPLE_PREFIX)) {
    try {
      const data = JSON.parse(banner.subtitle.slice(SIMPLE_PREFIX.length));
      return {
        ...DEFAULT_BANNER_CONTENT,
        ...data,
        button_text: banner.button_text || data.button_text || 'SHOP NOW',
        button_link: banner.button_link || data.button_link || '/shop',
      };
    } catch {
      // fallback
    }
  }

  // Check for legacy V2 JSON
  if (banner.subtitle && banner.subtitle.startsWith(JSON_PREFIX)) {
    try {
      const data = JSON.parse(banner.subtitle.slice(JSON_PREFIX.length));
      const lines = data.heading_lines || [];
      return {
        ...DEFAULT_BANNER_CONTENT,
        badge: data.badge || '',
        badge_color: data.badge_color || '#f97316',
        line1_text: lines[0]?.text || '',
        line1_color: lines[0]?.color || '#ffffff',
        line2_text: lines.slice(1).map((l: { text?: string }) => l.text).filter(Boolean).join(' ') || '',
        line2_color: lines[1]?.color || '#f97316',
        subtitle: data.subtitle || '',
        button_text: banner.button_text || data.button_text || 'SHOP NOW',
        button_link: banner.button_link || data.button_link || '/shop',
        show_overlay: data.show_overlay ?? true,
      };
    } catch {
      // fallback
    }
  }

  // Plain text banner fallback
  const rawTitle = banner.title?.trim() || '';
  const rawSubtitle = banner.subtitle?.trim() || '';
  let line1 = rawTitle;
  let line2 = '';

  if (rawTitle.includes('\n')) {
    const parts = rawTitle.split('\n');
    line1 = parts[0]?.trim() || '';
    line2 = parts.slice(1).join(' ').trim();
  }

  return {
    ...DEFAULT_BANNER_CONTENT,
    badge: 'Professional Tools Store',
    badge_color: '#f97316',
    line1_text: line1 || 'BUILT FOR',
    line1_color: '#ffffff',
    line2_text: line2 || 'THE JOB.',
    line2_color: '#f97316',
    subtitle: rawSubtitle || 'Professional tools. Serious performance.',
    button_text: banner.button_text || 'SHOP NOW',
    button_link: banner.button_link || '/shop',
    show_overlay: true,
  };
}

/**
 * Serialize SimpleBannerContent into database fields.
 */
export function serializeBannerContent(content: SimpleBannerContent): {
  title: string;
  subtitle: string;
  button_text: string | null;
  button_link: string | null;
} {
  const plainTitle = [content.line1_text, content.line2_text].filter(Boolean).join(' ').trim();
  const serializedSubtitle = `${SIMPLE_PREFIX}${JSON.stringify(content)}`;

  return {
    title: plainTitle || 'Hero Banner',
    subtitle: serializedSubtitle,
    button_text: content.button_text ? content.button_text.trim() : 'SHOP NOW',
    button_link: content.button_link ? content.button_link.trim() : '/shop',
  };
}
