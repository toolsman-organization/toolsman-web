import type { Metadata } from 'next';
import './globals.css';
import { getSiteUrl } from '@/lib/site-url';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/schema';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TOOLSMAN — Professional Power Tools & Equipment',
    template: '%s | TOOLSMAN',
  },
  description:
    'Buy genuine power tools, hand tools, machinery and accessories at TOOLSMAN. Fast delivery across Kerala. 100% authentic brands.',
  keywords: [
    'power tools',
    'hand tools',
    'power tools Kerala',
    'INGCO',
    'Bosch',
    'Makita',
    'DeWalt',
    'drilling machines',
    'angle grinders',
    'cordless tools',
  ],
  authors: [{ name: 'TOOLSMAN' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'TOOLSMAN',
    title: 'TOOLSMAN — Professional Power Tools & Equipment',
    description: 'Buy genuine power tools at TOOLSMAN. Fast delivery across Kerala. 100% authentic brands.',
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: 'TOOLSMAN',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOOLSMAN — Professional Power Tools & Equipment',
    description: 'Buy genuine power tools at TOOLSMAN. Fast delivery across Kerala.',
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: './',
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      'l_uKSWowdA4Q13NdI_WbBgtd5tD8PrgZvFhuqrIJpIU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

