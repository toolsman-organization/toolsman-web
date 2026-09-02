'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { AnnouncementBar } from '@/types/database';

interface AnnouncementBarProps {
  announcements: AnnouncementBar[];
}

export default function AnnouncementBarComponent({ announcements }: AnnouncementBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!announcements.length) return null;

  const current = announcements[activeIndex];

  return (
    <div
      style={{ backgroundColor: '#111111' }}
      className="text-white text-xs sm:text-sm py-2 px-4 text-center"
      role="marquee"
      aria-live="polite"
    >
      <div className="container-site flex items-center justify-center gap-2">
        <span className="font-medium">{current.message}</span>
        {current.link_text && current.link_url && (
          <Link
            href={current.link_url}
            className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2"
            style={{ color: '#f97316' }}
          >
            {current.link_text}
            <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
