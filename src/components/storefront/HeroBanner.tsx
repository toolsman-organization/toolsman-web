'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Banner } from '@/types/database';
import { parseBannerContent, type SimpleBannerContent } from '@/lib/bannerHelper';

interface HeroBannerProps {
  banners: Banner[];
}

export function BannerContentBlock({ content }: { content: SimpleBannerContent }) {
  return (
    <div className="flex flex-col w-full max-w-5xl items-start text-left mr-auto">
      {/* 1. Top Badge / Tagline */}
      {content.badge && (
        <span
          className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 inline-flex items-center gap-2 drop-shadow-sm"
          style={{ color: content.badge_color || '#f97316' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: content.badge_color || '#f97316' }}
          />
          {content.badge}
        </span>
      )}

      {/* 2. Two-Line Display Heading (strictly 1 line per headline row) */}
      <div className="flex flex-col gap-0.5 sm:gap-1 mb-3.5 w-full">
        {content.line1_text && (
          <h1
            className="font-serif text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] drop-shadow-md sm:whitespace-nowrap"
            style={{ color: content.line1_color || '#ffffff' }}
          >
            {content.line1_text}
          </h1>
        )}
        {content.line2_text && (
          <h1
            className="font-serif text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] drop-shadow-md sm:whitespace-nowrap"
            style={{ color: content.line2_color || '#f97316' }}
          >
            {content.line2_text}
          </h1>
        )}
      </div>

      {/* 3. Subtitle / Description */}
      {content.subtitle && (
        <p className="font-serif italic text-xs sm:text-sm md:text-base lg:text-lg text-neutral-200/95 font-normal leading-relaxed max-w-xl mb-4 sm:mb-5 drop-shadow-sm tracking-wide">
          {content.subtitle}
        </p>
      )}

      {/* 4. CTA Button (Placed below the subtitle) */}
      {content.button_text && (
        <div className="mt-1 sm:mt-2">
          <Link
            href={content.button_link || '/shop'}
            className="btn-primary text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3 sm:py-3.5 inline-flex items-center gap-2 shadow-xl shadow-orange-500/25 active:scale-95 transition-all"
          >
            <span>{content.button_text}</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const next = useCallback(() => {
    if (banners.length <= 1 || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
      setTransitioning(false);
    }, 250);
  }, [banners.length, transitioning]);

  const prev = useCallback(() => {
    if (banners.length <= 1 || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
      setTransitioning(false);
    }, 250);
  }, [banners.length, transitioning]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 5500);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  // Fallback when no banners in database
  if (!banners.length) {
    return (
      <section className="relative overflow-hidden bg-neutral-950 h-[calc(100dvh-60px)] sm:h-[calc(100dvh-112px)] min-h-[480px] max-h-[1000px] flex items-center">
        <div className="container-site py-8 sm:py-16 relative z-10">
          <BannerContentBlock
            content={{
              badge: 'Professional Tools Store',
              badge_color: '#f97316',
              line1_text: 'BUILT FOR',
              line1_color: '#ffffff',
              line2_text: 'THE JOB.',
              line2_color: '#f97316',
              subtitle: 'Heavy-duty power tools & industrial accessories with express delivery.',
              button_text: 'SHOP NOW',
              button_link: '/shop',
            }}
          />
        </div>
      </section>
    );
  }

  const activeBanner = banners[current];
  const structured = parseBannerContent(activeBanner);
  const showOverlay = structured.show_overlay !== false;
  const bannerLink = activeBanner.button_link || structured.button_link || '/shop';

  return (
    <section className="relative overflow-hidden bg-neutral-950 h-[calc(100dvh-60px)] sm:h-[calc(100dvh-112px)] min-h-[480px] max-h-[1000px] flex flex-col justify-center">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: transitioning ? 0.35 : 1 }}
      >
        {activeBanner.mobile_image_url ? (
          <>
            {/* Mobile Banner Image */}
            <div className="relative w-full h-full sm:hidden">
              <Image
                src={activeBanner.mobile_image_url}
                alt={activeBanner.title || 'Banner'}
                fill
                priority={current === 0}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 100vw"
              />
            </div>
            {/* Desktop Banner Image */}
            <div className="relative w-full h-full hidden sm:block">
              {activeBanner.image_url ? (
                <Image
                  src={activeBanner.image_url}
                  alt={activeBanner.title || 'Banner'}
                  fill
                  priority={current === 0}
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950" />
              )}
            </div>
          </>
        ) : activeBanner.image_url ? (
          <Image
            src={activeBanner.image_url}
            alt={activeBanner.title || 'Banner'}
            fill
            priority={current === 0}
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950" />
        )}

        {/* Clear, readable subtle contrast gradient */}
        {showOverlay && (
          <>
            {/* Mobile Gradient: Soft bottom fade to make text pop while keeping top product clear */}
            <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
            {/* Desktop Gradient: Left-to-right soft fade */}
            <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Content Overlay */}
      {showOverlay ? (
        <div className="container-site relative z-10 pb-10 pt-[68%] sm:pt-0 sm:py-16 lg:py-20 flex items-end sm:items-center">
          <div
            className="w-full"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}
          >
            <BannerContentBlock content={structured} />
          </div>
        </div>
      ) : (
        /* Graphic Banner (Pure Image click) */
        <Link
          href={bannerLink}
          className="absolute inset-0 z-10 block"
          aria-label={activeBanner.title || 'View Promotion'}
        />
      )}

      {/* Carousel Navigation (Arrows & Indicators) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all bg-black/50 hover:bg-orange-500 text-white backdrop-blur-md border border-white/15 cursor-pointer shadow-lg active:scale-95"
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all bg-black/50 hover:bg-orange-500 text-white backdrop-blur-md border border-white/15 cursor-pointer shadow-lg active:scale-95"
            aria-label="Next banner"
          >
            <ChevronRight size={20} />
          </button>

          {/* Sliding Indicator Pill */}
          <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-2xl">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === current
                    ? 'w-7 h-2 bg-orange-500 shadow-sm shadow-orange-500/50'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
