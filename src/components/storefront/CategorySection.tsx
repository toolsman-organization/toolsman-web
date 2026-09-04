import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Wrench, Hammer, Disc, Battery, Sparkles, ChevronRight } from 'lucide-react';
import type { Category } from '@/types/database';

interface CategorySectionProps {
  categories: Category[];
}

const fallbackCategoryIcons: Record<string, React.ReactNode> = {
  'drills-drivers': <Wrench className="w-10 h-10 text-orange-500" />,
  'angle-grinders': <Disc className="w-10 h-10 text-orange-500" />,
  'rotary-hammers': <Hammer className="w-10 h-10 text-orange-500" />,
  'cutting-tools': <Disc className="w-10 h-10 text-orange-500" />,
  'hand-tools': <Hammer className="w-10 h-10 text-orange-500" />,
  'accessories': <Sparkles className="w-10 h-10 text-orange-500" />,
  'batteries-chargers': <Battery className="w-10 h-10 text-orange-500" />,
};

export default function CategorySection({ categories }: CategorySectionProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-14 bg-neutral-50/70 border-b border-neutral-200/60">
      <div className="container-site">

        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
              Explore Our Range
            </span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight leading-none">
              Shop by Category
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

        {/* Category Carousel / Grid
            - Mobile (< 640px): EXACTLY 2 cards visible at a time with smooth horizontal swipe
            - Tablet (640–1023px): 3–4 columns grid
            - Laptop (1024–1279px): 6 columns grid
            - Desktop (1280px+): 6 to 8 columns grid */}
        <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative flex-none w-[calc(50vw-22px)] xs:w-[calc(50vw-24px)] sm:w-auto snap-start flex flex-col justify-between bg-white rounded-xl sm:rounded-2xl border border-neutral-200/90 hover:border-orange-500 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Product Showcase Image Stage */}
              <div className="relative w-full aspect-square bg-gradient-to-b from-neutral-50/90 to-neutral-100/50 p-3 sm:p-4 flex items-center justify-center overflow-hidden border-b border-neutral-100 group-hover:from-orange-50/40 group-hover:to-orange-50/10 transition-colors duration-300">
                {category.image_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                      className="object-contain p-1 group-hover:scale-110 transition-transform duration-300 ease-out"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {fallbackCategoryIcons[category.slug] || <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />}
                  </div>
                )}
              </div>

              {/* Title & Action */}
              <div className="p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center bg-white">
                <span className="text-xs sm:text-sm font-black text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                  {category.name}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 group-hover:text-orange-600 mt-1 inline-flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 duration-200">
                  Shop Now <ChevronRight size={11} />
                </span>
              </div>
            </Link>
          ))}
          {/* Right trailing buffer for smooth mobile swipe */}
          <div className="flex-none w-1 sm:hidden pointer-events-none" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}
