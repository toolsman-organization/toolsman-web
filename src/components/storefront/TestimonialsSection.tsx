'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Star, Quote, CheckCircle2, ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import type { Testimonial } from '@/types/database';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      const card = scrollRef.current.querySelector<HTMLElement>('.testimonial-card');
      if (card) {
        const cardWidth = card.getBoundingClientRect().width;
        const style = window.getComputedStyle(scrollRef.current);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        const index = Math.round(scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.max(0, Math.min(index, testimonials.length - 1)));
      }
    }
  }, [testimonials.length]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector<HTMLElement>('.testimonial-card');
      if (card) {
        const cardWidth = card.getBoundingClientRect().width;
        const style = window.getComputedStyle(container);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        const scrollStep = cardWidth + gap;

        container.scrollBy({
          left: direction === 'left' ? -scrollStep : scrollStep,
          behavior: 'smooth',
        });
      } else {
        container.scrollBy({
          left: direction === 'left' ? -360 : 360,
          behavior: 'smooth',
        });
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.querySelector<HTMLElement>('.testimonial-card');
      if (card) {
        const cardWidth = card.getBoundingClientRect().width;
        const style = window.getComputedStyle(container);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        const targetLeft = index * (cardWidth + gap);

        container.scrollTo({
          left: targetLeft,
          behavior: 'smooth',
        });
      }
    }
  };

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-neutral-50/80 border-b border-neutral-200/80 overflow-hidden">
      <div className="container-site">

        {/* Section Header: Matching New Arrivals Typography Exactly */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-1">
              <MessageSquareQuote size={14} className="shrink-0" />
              <span>Real Reviews From Real Customers</span>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight leading-none uppercase">
              What Our Customers Say
            </h2>
          </div>

          {/* Slider Navigation Arrows - Hidden on Mobile, Visible on Tablet & Laptop/Desktop */}
          {testimonials.length > 1 && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:text-orange-600 hover:border-orange-500 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-700 disabled:hover:border-neutral-200 disabled:hover:shadow-none transition-all duration-200 active:scale-95 shadow-2xs"
                aria-label="Previous Testimonials"
              >
                <ChevronLeft size={19} />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:text-orange-600 hover:border-orange-500 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-neutral-700 disabled:hover:border-neutral-200 disabled:hover:shadow-none transition-all duration-200 active:scale-95 shadow-2xs"
                aria-label="Next Testimonials"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          )}
        </div>

        {/* Sliding Testimonials Carousel - 1 card on Mobile (perfect width), 2 on Tablet, 3 on Desktop */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-3 pt-1 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        >
          {testimonials.map((t) => {
            const initial = t.name ? t.name.charAt(0).toUpperCase() : 'C';
            const cleanComment = t.comment ? t.comment.replace(/^["'“\s]+|["'”\s]+$/g, '') : '';

            return (
              <div
                key={t.id}
                className="testimonial-card flex-none w-full sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] snap-start bg-white p-5 sm:p-7 rounded-2xl border border-neutral-200/90 hover:border-orange-500/60 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 flex flex-col justify-between relative group select-none"
              >
                {/* Subtle top card highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Background Watermark Quote */}
                <Quote
                  size={52}
                  className="absolute right-4 top-4 text-neutral-100 group-hover:text-orange-100/50 transition-colors pointer-events-none -z-0"
                />

                <div className="relative z-10">
                  {/* Rating Stars & Verified Badge */}
                  <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < t.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-neutral-200'
                          }
                        />
                      ))}
                    </div>

                    {t.verified && (
                      <span className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  {/* Clean Formatted Comment Text */}
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic mb-5 sm:mb-6 min-h-[4rem] sm:min-h-[4.5rem]">
                    &ldquo;{cleanComment}&rdquo;
                  </p>
                </div>

                {/* Customer Profile Row */}
                <div className="pt-3.5 sm:pt-4 border-t border-neutral-100 flex items-center gap-3 relative z-10">
                  {/* Initials Avatar */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-orange-100">
                    {initial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-950 truncate">
                      {t.name}
                    </h4>
                    {t.role && (
                      <p className="text-[11px] sm:text-xs text-neutral-500 truncate mt-0.5 font-medium">
                        {t.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Dot Navigation for Mobile (Clean Swipe Indicators) */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4 sm:hidden">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === i ? 'w-6 bg-orange-600' : 'w-1.5 bg-neutral-300'
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
