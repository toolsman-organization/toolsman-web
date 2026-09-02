'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Banner } from '@/types/database';

interface HeroBannerProps {
  banners: Banner[];
}

// Fallback when no banners are configured
const fallbackSlide = {
  title: 'BUILT FOR',
  titleAccent: 'THE JOB.',
  subtitle: 'Professional tools. Serious performance.',
  buttonText: 'SHOP NOW',
  buttonLink: '/shop',
};

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
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  // No banners: show a styled placeholder
  if (!banners.length) {
    return (
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          minHeight: 'clamp(320px, 50vw, 560px)',
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
          }}
        />
        <div className="container-site h-full flex items-center py-16 relative z-10">
          <div className="max-w-xl">
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-2">
              Professional Tools Store
            </p>
            <h1 className="text-white leading-none mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              {fallbackSlide.title}
            </h1>
            <h2 className="leading-none mb-6" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#f97316' }}>
              {fallbackSlide.titleAccent}
            </h2>
            <p className="text-gray-300 text-lg mb-8">{fallbackSlide.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={fallbackSlide.buttonLink} className="btn-primary text-base px-8 py-3 gap-2">
                {fallbackSlide.buttonText}
                <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-6 mt-2">
                {['Sales', 'Service', 'Support'].map((label) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-gray-400 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 'clamp(300px, 50vw, 560px)' }}>
      {/* Background image */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: transitioning ? 0.4 : 1 }}
      >
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title ?? 'Banner'}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="100vw"
          />
        ) : (
          <div style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)' }} className="w-full h-full" />
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)' }} />
      </div>

      {/* Content */}
      <div className="container-site relative z-10 flex items-center py-16" style={{ minHeight: 'inherit' }}>
        <div className="max-w-lg" style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s' }}>
          {banner.title && (
            <h1
              className="text-white leading-tight mb-2 hero-text-shadow"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              {banner.title}
            </h1>
          )}
          {banner.subtitle && (
            <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">{banner.subtitle}</p>
          )}
          {banner.button_text && banner.button_link && (
            <Link href={banner.button_link} className="btn-primary text-base px-8 py-3 gap-2">
              {banner.button_text}
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-orange-500"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-orange-500"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            aria-label="Next slide"
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: i === current ? '#f97316' : 'rgba(255,255,255,0.5)',
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
