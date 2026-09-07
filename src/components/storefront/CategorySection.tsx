import Link from 'next/link';
import Image from 'next/image';
import { Wrench, Hammer, Disc, Battery, Sparkles } from 'lucide-react';
import type { Category } from '@/types/database';

interface CategorySectionProps {
  categories: Category[];
}

const fallbackCategoryIcons: Record<string, React.ReactNode> = {
  'drills-drivers': <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'angle-grinders': <Disc className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'rotary-hammers': <Hammer className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'cutting-tools': <Disc className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'hand-tools': <Hammer className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'accessories': <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
  'batteries-chargers': <Battery className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
};

export default function CategorySection({ categories }: CategorySectionProps) {
  const mainCategories = categories.filter((c) => !c.parent_id);
  const displayCategories = mainCategories.length > 0 ? mainCategories : categories;

  if (!displayCategories || displayCategories.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-14 bg-white border-b border-neutral-200/80 overflow-hidden">
      <div className="container-site">

        {/* Section Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Explore Our Range
          </span>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-neutral-950 tracking-tight uppercase leading-none">
            Shop by Category
          </h2>
        </div>

        {/* Circular Category Gallery — Centered Alignment & Balanced Dimensions */}
        <div className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group flex-none w-28 xs:w-32 sm:w-36 snap-start flex flex-col items-center justify-start text-center transition-transform duration-300"
            >
              {/* Circular Frame matching reference image */}
              <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-neutral-50/90 border-2 border-neutral-200/90 group-hover:border-orange-500 overflow-hidden shadow-2xs group-hover:shadow-lg group-hover:shadow-orange-500/15 transition-all duration-300 flex items-center justify-center p-3.5 sm:p-4 group-hover:scale-105 shrink-0">
                {category.image_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 120px, (max-width: 1024px) 150px, 180px"
                      className="object-contain p-1 group-hover:scale-110 transition-transform duration-300 ease-out"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 border border-orange-200/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {fallbackCategoryIcons[category.slug] || <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />}
                  </div>
                )}
              </div>

              {/* Centered Uppercase Category Title with uniform height */}
              <div className="w-full mt-3 sm:mt-3.5 min-h-[2.5rem] flex items-center justify-center">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight text-center">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
          {/* Right trailing buffer for smooth mobile swipe */}
          <div className="flex-none w-2 sm:hidden pointer-events-none" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}
