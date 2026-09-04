'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, ShieldCheck, Truck, Sparkles, Check, Tag } from 'lucide-react';
import type { Banner } from '@/types/database';
import { parseBannerContent } from '@/lib/bannerHelper';

interface PromoMidBannerProps {
  banners?: Banner[];
}

export default function PromoMidBanner({ banners = [] }: PromoMidBannerProps) {
  // If dynamic promo banner exists from admin
  if (banners && banners.length > 0) {
    const promo = banners[0];
    const structured = parseBannerContent(promo);
    const showOverlay = structured.show_overlay !== false;
    const bannerLink = promo.button_link || structured.button_link || '/shop';

    return (
      <section className="py-8 sm:py-12 bg-white">
        <div className="container-site">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex items-center">
            {/* Background image */}
            {promo.image_url ? (
              <div className="absolute inset-0">
                {promo.mobile_image_url ? (
                  <>
                    <Image
                      src={promo.mobile_image_url}
                      alt={promo.title || 'Promotion Banner'}
                      fill
                      className="object-cover sm:hidden"
                      sizes="(max-width: 640px) 100vw, 1200px"
                    />
                    <Image
                      src={promo.image_url}
                      alt={promo.title || 'Promotion Banner'}
                      fill
                      className="object-cover hidden sm:block"
                      sizes="1200px"
                    />
                  </>
                ) : (
                  <Image
                    src={promo.image_url}
                    alt={promo.title || 'Promotion Banner'}
                    fill
                    className="object-cover"
                    sizes="1200px"
                  />
                )}
                {showOverlay && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.2) 100%)',
                    }}
                  />
                )}
              </div>
            ) : (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(#f97316 1px, transparent 1px), radial-gradient(#ffffff 1px, #000000 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
            )}

            {/* Content */}
            {showOverlay ? (
              <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl text-white">
                {structured.badge && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3.5 shadow-sm"
                    style={{
                      backgroundColor: `${structured.badge_color || '#f97316'}20`,
                      color: structured.badge_color || '#f97316',
                      border: `1px solid ${structured.badge_color || '#f97316'}40`,
                    }}
                  >
                    <Sparkles size={13} />
                    <span>{structured.badge}</span>
                  </span>
                )}

                <div className="flex flex-col gap-1 mb-3">
                  {structured.heading_lines.map((line, idx) => (
                    <h2
                      key={line.id || idx}
                      className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: line.color || '#ffffff',
                      }}
                    >
                      {line.text}
                    </h2>
                  ))}
                </div>

                {structured.subtitle && (
                  <p className="text-sm sm:text-base text-neutral-300 mb-6 leading-relaxed max-w-lg">
                    {structured.subtitle}
                  </p>
                )}

                {structured.button_visible !== false && structured.button_text && (
                  <Link
                    href={bannerLink}
                    className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25"
                  >
                    <span>{structured.button_text}</span>
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            ) : (
              <Link href={bannerLink} className="absolute inset-0 z-10" aria-label={promo.title || 'View Promotion'} />
            )}
          </div>
        </div>
      </section>
    );
  }

  // High-Impact Pro Contractor Combo Banner
  return (
    <section className="py-5 sm:py-8 lg:py-12 bg-white">
      <div className="container-site">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-xl p-5 sm:p-8 lg:p-12 text-white">
          {/* Subtle industrial grid pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#f97316 1.5px, transparent 1.5px), radial-gradient(#ffffff 1px, #000000 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Radial orange glow accent */}
          <div
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full pointer-events-none opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Left Column: Clean, Minimal Offer Headlines & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white font-black text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider mb-2.5 sm:mb-3 shadow-xs">
                Special Pro Contractor Offer
              </span>

              <h2 className="text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight uppercase tracking-tight mb-2 sm:mb-2.5">
                Heavy Duty <span className="text-orange-500">Cordless Combo</span> Kits
              </h2>

              <p className="text-[11px] sm:text-xs lg:text-sm text-neutral-300 mb-4 sm:mb-5 leading-relaxed max-w-xl">
                Upgrade your workshop with high-output 20V brushless hammer drills & grinders. 2-Year warranty on all motors.
              </p>

              {/* Trust Badges: Compact on tablet/desktop */}
              <div className="hidden sm:flex flex-wrap gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-neutral-300">
                  <Zap size={13} className="text-amber-400 shrink-0" />
                  <span>20V Brushless Tech</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-neutral-300">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  <span>2-Year Warranty</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-neutral-300">
                  <Truck size={13} className="text-sky-400 shrink-0" />
                  <span>Fast Delivery</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <Link
                  href="/shop?category=cordless-tools"
                  className="btn-primary flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Explore Combo Kits</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/shop?sort=popular"
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-white/30 hover:border-white text-white font-bold text-xs sm:text-sm text-center transition-all hover:bg-white/10"
                >
                  View Deals
                </Link>
              </div>
            </div>

            {/* Right Column: Shown on Desktop for balanced 2-column layout */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6 shadow-2xl relative overflow-hidden">
                {/* Accent top gradient stripe */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-orange-400">
                    <Tag size={12} />
                    <span>Contractor Value Pack</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30">
                    Save Up to 35%
                  </span>
                </div>

                <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">
                  What&apos;s Included In Every Pro Kit:
                </h3>

                <ul className="space-y-2 mb-5 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-white">Dual 4.0Ah Li-Ion Batteries</strong> for continuous power.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-white">Rapid Intelligent Charger</strong> (Fast charging).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-white">Heavy-Duty Carrying Case</strong> with metal latches.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span>
                      <strong className="text-white">Official GST Invoice & 2-Year Warranty</strong> included.
                    </span>
                  </li>
                </ul>

                <Link
                  href="/shop"
                  className="w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 hover:border-orange-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Browse Power Tool Kits</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
