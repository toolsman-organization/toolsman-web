'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Banner } from '@/types/database';
import {
  parseBannerContent,
  DEFAULT_BANNER_TEMPLATE,
  type BannerStructuredContent,
  type BannerHeadingSize,
  type BannerHeadingWeight,
} from '@/lib/bannerHelper';
import BannerFeatureIconComponent from './BannerFeatureIcon';

interface HeroBannerProps {
  banners: Banner[];
}

function getHeadingSizeClass(size: BannerHeadingSize): string {
  switch (size) {
    case 'small':
      return 'text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wide leading-tight';
    case 'medium':
      return 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide leading-tight';
    case 'large':
      return 'text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-wider leading-[0.96]';
    case 'massive':
      return 'text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] xl:text-[10rem] tracking-widest leading-[0.92]';
    case 'extra-large':
    default:
      return 'text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.5rem] tracking-wider leading-[0.94]';
  }
}

function getHeadingWeightClass(weight: BannerHeadingWeight): string {
  switch (weight) {
    case 'normal':
      return 'font-normal';
    case 'semibold':
      return 'font-semibold';
    case 'bold':
      return 'font-bold';
    case 'extrabold':
      return 'font-extrabold';
    case 'black':
    default:
      return 'font-black';
  }
}

function getButtonStyleClass(style?: string): string {
  switch (style) {
    case 'secondary':
      return 'btn-secondary text-white border-white/60 hover:bg-white hover:text-neutral-950 text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3';
    case 'dark':
      return 'btn-dark bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700 text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3';
    case 'outline-white':
      return 'inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded text-xs sm:text-sm font-bold border-2 border-white text-white hover:bg-white hover:text-neutral-950 transition-all';
    case 'primary':
    default:
      return 'btn-primary text-xs sm:text-sm md:text-base px-5 sm:px-7 py-2.5 sm:py-3 gap-2 shadow-lg shadow-orange-500/30';
  }
}

/**
 * Reusable Banner Content View used for both Storefront and Admin Live Preview.
 */
export function BannerContentView({
  content,
  isLive = false,
}: {
  content: BannerStructuredContent;
  isLive?: boolean;
}) {
  const horizontalClass = useMemo(() => {
    switch (content.horizontal_position) {
      case 'center':
        return 'items-center text-center mx-auto';
      case 'right':
        return 'items-end text-right ml-auto';
      case 'left':
      default:
        return 'items-start text-left mr-auto';
    }
  }, [content.horizontal_position]);

  return (
    <div className={`flex flex-col max-w-2xl lg:max-w-3xl xl:max-w-4xl ${horizontalClass}`}>
      {/* 1. Top Badge / Tagline */}
      {content.badge && (
        <span
          className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2.5 inline-flex items-center gap-2 drop-shadow-sm"
          style={{ color: content.badge_color || '#f97316' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: content.badge_color || '#f97316' }}
          />
          {content.badge}
        </span>
      )}

      {/* 2. Multi-line Headings with impactful elongated display typography */}
      <div className="flex flex-col gap-1 sm:gap-1.5 mb-3.5">
        {content.heading_lines.map((line, idx) => (
          <h1
            key={line.id || idx}
            className={`${getHeadingSizeClass(line.size)} ${getHeadingWeightClass(
              line.weight
            )} uppercase drop-shadow-lg`}
            style={{
              fontFamily: 'var(--font-display)',
              color: line.color || '#ffffff',
            }}
          >
            {line.text}
          </h1>
        ))}
      </div>

      {/* 3. Subtitle */}
      {content.subtitle && (
        <p
          className="text-sm sm:text-base lg:text-lg xl:text-xl mb-2.5 leading-relaxed font-medium drop-shadow-sm max-w-xl"
          style={{ color: content.subtitle_color || '#d4d4d4' }}
        >
          {content.subtitle}
        </p>
      )}

      {/* 4. Optional Description */}
      {content.description && (
        <p
          className="text-xs sm:text-sm mb-4 leading-relaxed max-w-lg"
          style={{ color: content.description_color || '#a3a3a3' }}
        >
          {content.description}
        </p>
      )}

      {/* 5. Feature Badges (e.g. Sales, Service, Support) */}
      {content.features && content.features.length > 0 && (
        <div
          className={`flex flex-wrap gap-2.5 sm:gap-4 my-4 ${
            content.horizontal_position === 'center'
              ? 'justify-center'
              : content.horizontal_position === 'right'
              ? 'justify-end'
              : 'justify-start'
          }`}
        >
          {content.features.map((feat, idx) => (
            <div
              key={feat.id || idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/45 backdrop-blur-xs border border-white/10 shadow-sm"
            >
              <BannerFeatureIconComponent icon={feat.icon} size={15} className="text-orange-500 shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-black text-white uppercase tracking-wider">{feat.title}</span>
                {feat.description && (
                  <span className="text-[9px] text-neutral-400 font-medium mt-0.5">{feat.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. CTA Button */}
      {content.button_visible !== false && content.button_text && (
        <div className="mt-2.5 pt-1">
          {isLive ? (
            <span className={getButtonStyleClass(content.button_style)}>
              <span>{content.button_text}</span>
              <ArrowRight size={17} />
            </span>
          ) : (
            <Link href={content.button_link || '/shop'} className={getButtonStyleClass(content.button_style)}>
              <span>{content.button_text}</span>
              <ArrowRight size={17} />
            </Link>
          )}
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
    }, 300);
  }, [banners.length, transitioning]);

  const prev = useCallback(() => {
    if (banners.length <= 1 || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
      setTransitioning(false);
    }, 300);
  }, [banners.length, transitioning]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 5500);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  // Fallback state when no banner exists
  if (!banners.length) {
    return (
      <section
        className="relative overflow-hidden bg-neutral-950"
        style={{
          minHeight: 'clamp(500px, 68vh, 680px)',
        }}
      >
        {/* Industrial Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
          }}
        />
        {/* Radial highlight */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.25) 0%, transparent 60%)',
          }}
        />

        <div className="container-site h-full flex items-center py-16 sm:py-24 relative z-10">
          <BannerContentView content={DEFAULT_BANNER_TEMPLATE} />
        </div>
      </section>
    );
  }

  const activeBanner = banners[current];
  const structured = parseBannerContent(activeBanner);
  const showOverlay = structured.show_overlay !== false;

  // Determine vertical alignment container class
  const verticalContainerClass =
    structured.vertical_position === 'top'
      ? 'items-start pt-14 sm:pt-20 pb-20'
      : structured.vertical_position === 'bottom'
      ? 'items-end pt-20 pb-14 sm:pb-20'
      : 'items-center py-16 sm:py-20 lg:py-24';

  // Dynamic gradient overlay depending on content horizontal position
  const gradientOverlay =
    structured.horizontal_position === 'right'
      ? 'linear-gradient(to left, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.15) 100%)'
      : structured.horizontal_position === 'center'
      ? 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.75) 100%)'
      : 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 58%, rgba(0,0,0,0.15) 100%)';

  const bannerLink = activeBanner.button_link || structured.button_link || '/shop';

  return (
    <section
      className="relative overflow-hidden bg-neutral-950"
      style={{ minHeight: 'clamp(500px, 68vh, 680px)' }}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: transitioning ? 0.3 : 1 }}
      >
        {activeBanner.mobile_image_url ? (
          <>
            {/* Mobile Banner Image */}
            <div className="relative w-full h-full sm:hidden">
              <Image
                src={activeBanner.mobile_image_url}
                alt={structured.heading_lines[0]?.text || activeBanner.title || 'Toolsman Hero Banner'}
                fill
                className="object-cover"
                priority={current === 0}
                sizes="100vw"
              />
            </div>
            {/* Desktop Banner Image */}
            <div className="relative w-full h-full hidden sm:block">
              {activeBanner.image_url ? (
                <Image
                  src={activeBanner.image_url}
                  alt={structured.heading_lines[0]?.text || activeBanner.title || 'Toolsman Hero Banner'}
                  fill
                  className="object-cover"
                  priority={current === 0}
                  sizes="100vw"
                />
              ) : (
                <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' }} className="w-full h-full" />
              )}
            </div>
          </>
        ) : activeBanner.image_url ? (
          <Image
            src={activeBanner.image_url}
            alt={structured.heading_lines[0]?.text || activeBanner.title || 'Toolsman Hero Banner'}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="100vw"
          />
        ) : (
          <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' }} className="w-full h-full" />
        )}

        {/* Dynamic Dark Gradient Overlay for Readability (Only shown if overlay content is enabled) */}
        {showOverlay && (
          <div className="absolute inset-0" style={{ background: gradientOverlay }} />
        )}
      </div>

      {/* HTML Content Overlay Layer OR Clickable Area */}
      {showOverlay ? (
        <div
          className={`container-site relative z-10 flex ${verticalContainerClass}`}
          style={{ minHeight: 'inherit' }}
        >
          <div
            className="w-full"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <BannerContentView content={structured} />
          </div>
        </div>
      ) : (
        /* In Graphic Banner mode, the entire banner is clickable */
        <Link
          href={bannerLink}
          className="absolute inset-0 z-10 block"
          aria-label={activeBanner.title || 'View Banner Promotion'}
        />
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all bg-black/50 hover:bg-orange-500 text-white backdrop-blur-xs border border-white/10 cursor-pointer shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all bg-black/50 hover:bg-orange-500 text-white backdrop-blur-xs border border-white/10 cursor-pointer shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: i === current ? '24px' : '7px',
                  height: '7px',
                  backgroundColor: i === current ? '#f97316' : 'rgba(255,255,255,0.4)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
