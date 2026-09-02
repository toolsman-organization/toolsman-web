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
    <section className="py-8 sm:py-12 bg-white border-b border-neutral-200/60">
      <div className="container-site">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Authorized Partner
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight mt-0.5">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/shop"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>View All</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Brand Logos Grid matching Reference Design */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/shop?brand=${brand.slug}`}
              className="group flex flex-col items-center justify-center h-20 sm:h-24 p-3 rounded-xl bg-neutral-50/80 hover:bg-white border border-neutral-200/70 hover:border-orange-500 hover:shadow-md transition-all duration-300"
            >
              {brand.logo_url ? (
                <div className="relative w-full h-10 flex items-center justify-center">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={100}
                    height={40}
                    className="max-h-8 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ) : (
                <span className="font-black text-sm sm:text-base text-neutral-800 tracking-wider group-hover:text-orange-600 transition-colors">
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
