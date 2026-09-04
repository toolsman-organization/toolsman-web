import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Brand } from '@/types/database';

interface BrandSectionProps {
  brands: Brand[];
}

export default function BrandSection({ brands }: BrandSectionProps) {
  if (!brands || brands.length === 0) return null;

  // Duplicate brands array to ensure continuous smooth infinite marquee loop
  const duplicatedBrands =
    brands.length < 6
      ? [...brands, ...brands, ...brands, ...brands]
      : [...brands, ...brands];

  return (
    <section className="py-8 sm:py-12 lg:py-14 bg-white border-b border-neutral-200/60 overflow-hidden">
      <div className="container-site">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
              Authorized Partners
            </span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight leading-none">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/shop"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

      {/* Auto-sliding Single-line Marquee with edge gradient fade */}
      <div className="relative w-full overflow-hidden py-1">
        {/* Left & Right gradient edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Sliding brand track */}
        <div className="animate-brand-marquee flex items-center gap-3 sm:gap-4 lg:gap-5">
          {duplicatedBrands.map((brand, idx) => (
            <Link
              key={`${brand.id}-${idx}`}
              href={`/shop?brand=${brand.slug}`}
              className="group shrink-0 flex items-center justify-center w-36 xs:w-40 sm:w-48 lg:w-52 h-20 xs:h-22 sm:h-26 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white hover:bg-white border border-neutral-200/90 hover:border-orange-500 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {brand.logo_url ? (
                <div className="relative w-full h-10 xs:h-12 sm:h-14 flex items-center justify-center">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    fill
                    sizes="140px"
                    className="object-contain p-1 group-hover:scale-108 transition-transform duration-300"
                  />
                </div>
              ) : (
                <span className="font-black text-xs sm:text-sm md:text-base text-neutral-900 group-hover:text-orange-600 transition-colors tracking-wider text-center leading-tight">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
