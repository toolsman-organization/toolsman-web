import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TOOLSMAN — Professional Power Tools',
    template: '%s | TOOLSMAN',
  },
  description:
    'Buy genuine power tools, hand tools and accessories at TOOLSMAN. Fast delivery across Kerala. 100% authentic brands.',
  keywords: ['power tools', 'hand tools', 'INGCO', 'Bosch', 'Makita', 'DeWalt', 'Kerala', 'tools'],
  authors: [{ name: 'TOOLSMAN' }],
  openGraph: {
    type: 'website',
    siteName: 'TOOLSMAN',
    title: 'TOOLSMAN — Professional Power Tools',
    description: 'Buy genuine power tools at TOOLSMAN. Fast delivery across Kerala.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
