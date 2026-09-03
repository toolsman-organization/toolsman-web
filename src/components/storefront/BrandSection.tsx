import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Brand } from '@/types/database';

interface BrandSectionProps {
  brands: Brand[];
}

export default function BrandSection({ brands }: BrandSectionProps) {
  if (!brands || brands.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-14 bg-white border-b border-neutral-200/60">
      <div className="container-site">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
              Authorized Partner
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight leading-none">
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

        {/* Brand Logos Grid
            - Mobile: 2 columns
            - Tablet: 4 columns
            - Laptop 1024px: 4 columns (good size)
            - Desktop 1280px+: 8 columns
            Logos always display in original uploaded colors — no filter applied */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/shop?brand=${brand.slug}`}
              className="group flex flex-col items-center justify-center h-24 sm:h-28 p-4 rounded-xl bg-neutral-50 hover:bg-white border border-neutral-200/70 hover:border-orange-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {brand.logo_url ? (
                <div className="w-full h-14 sm:h-16 flex items-center justify-center">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={120}
                    height={56}
                    className="max-h-12 max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ) : (
                <span className="font-black text-sm text-neutral-800 group-hover:text-orange-600 transition-colors tracking-wider text-center leading-tight">
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
