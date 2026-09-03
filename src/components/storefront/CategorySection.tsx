import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Wrench, Hammer, Disc, Zap, Battery, Sparkles } from 'lucide-react';
import type { Category } from '@/types/database';

interface CategorySectionProps {
  categories: Category[];
}

const fallbackCategoryIcons: Record<string, React.ReactNode> = {
  'drills-drivers': <Wrench className="w-8 h-8 text-orange-500" />,
  'angle-grinders': <Disc className="w-8 h-8 text-orange-500" />,
  'rotary-hammers': <Hammer className="w-8 h-8 text-orange-500" />,
  'cutting-tools': <Disc className="w-8 h-8 text-orange-500" />,
  'hand-tools': <Hammer className="w-8 h-8 text-orange-500" />,
  'accessories': <Sparkles className="w-8 h-8 text-orange-500" />,
  'batteries-chargers': <Battery className="w-8 h-8 text-orange-500" />,
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
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight leading-none">
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

        {/* Category Grid
            - Mobile (< 640px): 2 columns
            - Tablet (640–1023px): 4 columns
            - Laptop (1024–1279px): 6 columns
            - Desktop (1280px+): 8 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-orange-500 hover:shadow-lg transition-all duration-250"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-xl bg-neutral-50 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-orange-50 transition-all duration-250 overflow-hidden">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    width={56}
                    height={56}
                    className="object-contain w-10 h-10 sm:w-12 sm:h-12"
                  />
                ) : (
                  fallbackCategoryIcons[category.slug] || <Wrench className="w-7 h-7 text-orange-500" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-neutral-800 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                {category.name}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
