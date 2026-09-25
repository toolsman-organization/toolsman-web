import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | TOOLSMAN',
  description: 'Track your power tools order shipment status and delivery progress in real-time with TOOLSMAN.',
  alternates: {
    canonical: '/track-order',
  },
  openGraph: {
    title: 'Track Your Order | TOOLSMAN',
    description: 'Track your power tools order shipment status and delivery progress in real-time with TOOLSMAN.',
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
