import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/account/',
        '/checkout/',
        '/cart/',
        '/login/',
        '/register/',
        '/forgot-password/',
        '/reset-password/',
        '/auth/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}


