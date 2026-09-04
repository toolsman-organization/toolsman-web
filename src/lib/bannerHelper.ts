import type { Banner } from '@/types/database';

export type BannerHeadingSize = 'small' | 'medium' | 'large' | 'extra-large' | 'massive';
export type BannerHeadingWeight = 'normal' | 'semibold' | 'bold' | 'extrabold' | 'black';
export type BannerHorizontalPosition = 'left' | 'center' | 'right';
export type BannerVerticalPosition = 'top' | 'center' | 'bottom';
export type BannerButtonStyle = 'primary' | 'secondary' | 'dark' | 'outline-white';
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
  | 'pen-tool'
  | 'clock'
  | 'package'
  | 'sparkles';

export interface BannerHeadingLine {
  id: string;
  text: string;
  color: string;
  size: BannerHeadingSize;
  weight: BannerHeadingWeight;
}

export interface BannerFeatureItem {
  id: string;
  icon: BannerFeatureIcon;
  title: string;
  description?: string;
}

export interface BannerStructuredContent {
  version: 2;
  show_overlay?: boolean;
  badge?: string;
  badge_color?: string;
  heading_lines: BannerHeadingLine[];
  subtitle?: string;
  subtitle_color?: string;
  description?: string;
  description_color?: string;
  features: BannerFeatureItem[];
  button_text?: string;
  button_link?: string;
  button_visible?: boolean;
  button_style?: BannerButtonStyle;
  horizontal_position: BannerHorizontalPosition;
  vertical_position: BannerVerticalPosition;
}

export const BANNER_COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Brand Orange', value: '#f97316' },
  { label: 'Amber Gold', value: '#f59e0b' },
  { label: 'Emerald Green', value: '#22c55e' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Light Gray', value: '#e5e5e5' },
  { label: 'Dark Slate', value: '#111111' },
];

export const BANNER_ICON_OPTIONS: { value: BannerFeatureIcon; label: string }[] = [
  { value: 'shield', label: 'Shield (Warranty / Genuine)' },
  { value: 'wrench', label: 'Wrench (Service / Repairs)' },
  { value: 'headphones', label: 'Headphones (Support / Help)' },
  { value: 'truck', label: 'Truck (Fast Delivery)' },
  { value: 'award', label: 'Award (Certified / Quality)' },
  { value: 'check', label: 'Check (Verified / Tested)' },
  { value: 'star', label: 'Star (Top Rated)' },
  { value: 'refresh', label: 'Refresh (Rentals / Exchange)' },
  { value: 'zap', label: 'Lightning (High Power / Fast)' },
  { value: 'clock', label: 'Clock (Same-Day Dispatch)' },
  { value: 'package', label: 'Package (Safe Delivery)' },
  { value: 'sparkles', label: 'Sparkles (New / Featured)' },
];

export const DEFAULT_BANNER_TEMPLATE: BannerStructuredContent = {
  version: 2,
  show_overlay: true,
  badge: 'Professional Tools Store',
  badge_color: '#f97316',
  heading_lines: [
    {
      id: 'h-1',
      text: 'BUILT FOR',
      color: '#ffffff',
      size: 'extra-large',
      weight: 'black',
    },
    {
      id: 'h-2',
      text: 'THE JOB.',
      color: '#f97316',
      size: 'extra-large',
      weight: 'black',
    },
  ],
  subtitle: 'Professional tools. Serious performance.',
  subtitle_color: '#d4d4d4',
  description: '',
  description_color: '#a3a3a3',
  features: [
    { id: 'f-1', icon: 'shield', title: 'SALES', description: 'Buy with confidence' },
    { id: 'f-2', icon: 'wrench', title: 'SERVICE', description: 'After sales support' },
    { id: 'f-3', icon: 'headphones', title: 'SUPPORT', description: 'We are here to help' },
  ],
  button_text: 'SHOP NOW',
  button_link: '/shop',
  button_visible: true,
  button_style: 'primary',
  horizontal_position: 'left',
  vertical_position: 'center',
};

const JSON_PREFIX = '__BANNER_V2__:';

/**
 * Safely parse a Banner record into BannerStructuredContent.
 * Handles both V2 structured JSON formats and legacy standard text banners.
 */
export function parseBannerContent(banner: Partial<Banner> | null | undefined): BannerStructuredContent {
  if (!banner) return { ...DEFAULT_BANNER_TEMPLATE };

  // Check if subtitle contains the serialized V2 structured JSON
  if (banner.subtitle && banner.subtitle.startsWith(JSON_PREFIX)) {
    try {
      const jsonStr = banner.subtitle.slice(JSON_PREFIX.length);
      const parsed = JSON.parse(jsonStr) as BannerStructuredContent;
      if (parsed && parsed.version === 2) {
        return {
          ...DEFAULT_BANNER_TEMPLATE,
          ...parsed,
          show_overlay: parsed.show_overlay ?? true,
          button_text: banner.button_text ?? parsed.button_text ?? 'SHOP NOW',
          button_link: banner.button_link ?? parsed.button_link ?? '/shop',
          button_visible: parsed.button_visible ?? Boolean(banner.button_text),
        };
      }
    } catch (e) {
      console.warn('[parseBannerContent] Failed to parse V2 JSON, falling back to legacy structure:', e);
    }
  }

  // Legacy Banner Fallback: split title into lines if possible
  const rawTitle = banner.title?.trim() || '';
  const rawSubtitle = banner.subtitle?.trim() || '';

  let lines: BannerHeadingLine[] = [];
  if (rawTitle) {
    if (rawTitle.includes('\n')) {
      lines = rawTitle.split('\n').filter(Boolean).map((t, idx) => ({
        id: `h-${idx + 1}`,
        text: t.trim(),
        color: idx === 0 ? '#ffffff' : '#f97316',
        size: 'extra-large' as BannerHeadingSize,
        weight: 'black' as BannerHeadingWeight,
      }));
    } else {
      lines = [
        {
          id: 'h-1',
          text: rawTitle,
          color: '#ffffff',
          size: 'extra-large' as BannerHeadingSize,
          weight: 'black' as BannerHeadingWeight,
        },
      ];
    }
  } else {
    lines = [...DEFAULT_BANNER_TEMPLATE.heading_lines];
  }

  return {
    version: 2,
    show_overlay: true,
    badge: 'Professional Tools Store',
    badge_color: '#f97316',
    heading_lines: lines,
    subtitle: rawSubtitle || 'Professional tools. Serious performance.',
    subtitle_color: '#d4d4d4',
    description: '',
    description_color: '#a3a3a3',
    features: [
      { id: 'f-1', icon: 'shield', title: 'SALES', description: 'Buy with confidence' },
      { id: 'f-2', icon: 'wrench', title: 'SERVICE', description: 'After sales support' },
      { id: 'f-3', icon: 'headphones', title: 'SUPPORT', description: 'We are here to help' },
    ],
    button_text: banner.button_text || 'SHOP NOW',
    button_link: banner.button_link || '/shop',
    button_visible: Boolean(banner.button_text),
    button_style: 'primary',
    horizontal_position: 'left',
    vertical_position: 'center',
  };
}

/**
 * Serialize BannerStructuredContent into database fields.
 */
export function serializeBannerContent(content: BannerStructuredContent): {
  title: string;
  subtitle: string;
  button_text: string | null;
  button_link: string | null;
} {
  const plainTitle = content.heading_lines.map((h) => h.text.trim()).filter(Boolean).join(' ');
  const serializedSubtitle = `${JSON_PREFIX}${JSON.stringify(content)}`;

  return {
    title: plainTitle || 'Hero Banner',
    subtitle: serializedSubtitle,
    button_text: content.button_visible && content.button_text ? content.button_text.trim() : null,
    button_link: content.button_link ? content.button_link.trim() : '/shop',
  };
}
