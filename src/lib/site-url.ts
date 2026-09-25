/**
 * Centralized Site URL helper for TOOLSMAN.
 * Ensures consistent canonical URLs, sitemaps, OpenGraph metadata, and structured data.
 * Guarantees production domain fallback to https://www.toolsmanshop.com without leaking localhost.
 */

const PRODUCTION_SITE_URL = 'https://www.toolsmanshop.com';

export function getSiteUrl(): string {
  // Check explicit public app/site URLs first
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (envUrl && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // In production environment or if valid URL is provided, return it
    if (process.env.NODE_ENV === 'production' && trimmed.includes('localhost')) {
      return PRODUCTION_SITE_URL;
    }
    return trimmed;
  }

  // In production builds or server environments, default to production domain
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_SITE_URL;
  }

  // Local development fallback
  return 'http://localhost:3000';
}

export function getAbsoluteUrl(path: string = ''): string {
  const baseUrl = getSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath === '/' ? '' : normalizedPath}`;
}
