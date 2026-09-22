'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Tag, Zap } from 'lucide-react';
import type { Banner } from '@/types/database';

interface PromoMidBannerProps {
  banners?: Banner[];
}

interface SinglePromoBannerProps {
  banner?: Banner;
  fallbackContent?: {
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    gradient: string;
    accentColor: string;
    icon: 'zap' | 'tag' | 'sparkles';
  };
}

function SinglePromoBanner({ banner, fallbackContent }: SinglePromoBannerProps) {
  // If banner image is uploaded in Admin
  if (banner && banner.image_url) {
    const bannerLink = banner.button_link || '/shop';

    return (
      <Link
        href={bannerLink}
        className="group relative block w-full aspect-[2/1] rounded-2xl sm:rounded-4xl overflow-hidden bg-neutral-950 shadow-md hover:shadow-2xl transition-all duration-300"
      >
        {banner.mobile_image_url ? (
          <>
            {/* Mobile Banner Image */}
            <Image
              src={banner.mobile_image_url}
              alt={banner.title || 'Promotional Banner'}
              fill
              className="object-cover sm:hidden group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
            />
            {/* Desktop Banner Image */}
            <Image
              src={banner.image_url}
              alt={banner.title || 'Promotional Banner'}
              fill
              className="object-cover hidden sm:block group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 1024px) 50vw, 640px"
            />
          </>
        ) : (
          <Image
            src={banner.image_url}
            alt={banner.title || 'Promotional Banner'}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
          />
        )}
      </Link>
    );
  }

  // Fallback card when no custom image is uploaded yet
  if (!fallbackContent) return null;

  return (
    <Link
      href={fallbackContent.buttonLink}
      className="group relative block w-full aspect-[2/1] rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 p-5 sm:p-7 flex flex-col justify-between shadow-md hover:shadow-2xl transition-all duration-300 hover:border-orange-500/50"
    >
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#f97316 1.5px, transparent 1.5px), radial-gradient(#ffffff 1px, #000000 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div
        className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: fallbackContent.gradient }}
      />

      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2.5 shadow-xs"
          style={{
            backgroundColor: `${fallbackContent.accentColor}25`,
            color: fallbackContent.accentColor,
            border: `1px solid ${fallbackContent.accentColor}50`,
          }}
        >
          {fallbackContent.icon === 'zap' && <Zap size={12} />}
          {fallbackContent.icon === 'tag' && <Tag size={12} />}
          {fallbackContent.icon === 'sparkles' && <Sparkles size={12} />}
          <span>{fallbackContent.badge}</span>
        </span>

        <h3 className="font-black text-lg sm:text-2xl text-white uppercase tracking-tight leading-tight">
          {fallbackContent.title}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 mt-1">
          {fallbackContent.subtitle}
        </p>
      </div>

      <div className="relative z-10 pt-2">
        <span className="btn-primary inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 group-hover:scale-[1.02] transition-transform">
          <span>{fallbackContent.buttonText}</span>
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default function PromoMidBanner({ banners = [] }: PromoMidBannerProps) {
  const activePromoBanners = banners.filter((b) => b.is_active);

  // If 2 or more promo banners exist in admin
  if (activePromoBanners.length >= 2) {
    return (
      <section className="py-6 sm:py-10 lg:py-12 bg-white">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <SinglePromoBanner banner={activePromoBanners[0]} />
            <SinglePromoBanner banner={activePromoBanners[1]} />
          </div>
        </div>
      </section>
    );
  }

  // If 1 promo banner exists in admin, show it with a fallback banner
  if (activePromoBanners.length === 1) {
    return (
      <section className="py-6 sm:py-10 lg:py-12 bg-white">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <SinglePromoBanner banner={activePromoBanners[0]} />
            <SinglePromoBanner
              fallbackContent={{
                badge: 'Special Contractor Pack',
                title: 'HEAVY DUTY COMBO KITS',
                subtitle: 'High-output 20V brushless tools with 2 batteries, rapid charger & carrying case.',
                buttonText: 'EXPLORE COMBO KITS',
                buttonLink: '/shop?category=cordless-tools',
                gradient: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
                accentColor: '#f97316',
                icon: 'zap',
              }}
            />
          </div>
        </div>
      </section>
    );
  }

  // Fallback 2-banner grid when no custom banners have been uploaded yet in admin
  return (
    <section className="py-6 sm:py-10 lg:py-12 bg-white">
      <div className="container-site">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <SinglePromoBanner
            fallbackContent={{
              badge: 'Special Pro Offer',
              title: 'HEAVY DUTY CORDLESS COMBO KITS',
              subtitle: 'Upgrade your workshop with 20V brushless tools. Dual batteries & 2-year warranty.',
              buttonText: 'EXPLORE COMBO KITS',
              buttonLink: '/shop?category=cordless-tools',
              gradient: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
              accentColor: '#f97316',
              icon: 'zap',
            }}
          />
          <SinglePromoBanner
            fallbackContent={{
              badge: 'Limited Time Deal',
              title: 'PROFESSIONAL POWER TOOLS — UP TO 40% OFF',
              subtitle: 'Top brand rotary hammers, angle grinders, circular saws, and industrial accessories.',
              buttonText: 'VIEW ALL DEALS',
              buttonLink: '/shop?sort=popular',
              gradient: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
              accentColor: '#f59e0b',
              icon: 'tag',
            }}
          />
        </div>
      </div>
    </section>
  );
}
