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
    <section className="py-8 sm:py-12 bg-neutral-50/70 border-b border-neutral-200/60">
      <div className="container-site">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Explore Our Range
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight mt-0.5">
              Shop by Category
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

        {/* Category Icons Grid matching Reference Design */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white border border-neutral-200/80 hover:border-orange-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-neutral-50 flex items-center justify-center p-2 mb-2.5 group-hover:scale-110 group-hover:bg-orange-50 transition-all duration-300 relative overflow-hidden">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                ) : (
                  fallbackCategoryIcons[category.slug] || <Wrench className="w-7 h-7 text-orange-500" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 group-hover:text-orange-600 transition-colors line-clamp-2">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
