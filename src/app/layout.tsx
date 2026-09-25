import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TOOLSMAN — Professional Power Tools',
    template: '%s | TOOLSMAN',
  },
  description:
    'Buy genuine power tools, hand tools and accessories at TOOLSMAN. Fast delivery across Kerala. 100% authentic brands.',
  keywords: ['power tools', 'hand tools', 'INGCO', 'Bosch', 'Makita', 'DeWalt', 'Kerala', 'tools'],
  authors: [{ name: 'TOOLSMAN' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'TOOLSMAN',
    title: 'TOOLSMAN — Professional Power Tools',
    description: 'Buy genuine power tools at TOOLSMAN. Fast delivery across Kerala.',
    images: [{ url: '/logo.png' }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
