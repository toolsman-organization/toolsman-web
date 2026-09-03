import Link from 'next/link';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import HeroBanner from '@/components/storefront/HeroBanner';
import CategorySection from '@/components/storefront/CategorySection';
import BrandSection from '@/components/storefront/BrandSection';
import ProductCard from '@/components/storefront/ProductCard';
import TrustSection from '@/components/storefront/TrustSection';
import WhyChooseSection from '@/components/storefront/WhyChooseSection';
import TestimonialsSection from '@/components/storefront/TestimonialsSection';
import { getActiveBanners } from '@/services/banners';
import { getActiveCategories } from '@/services/categories';
import { getActiveBrands } from '@/services/brands';
import { getFeaturedProducts, getBestSellerProducts, getNewArrivalProducts } from '@/services/products';

export const revalidate = 60; // ISR 1 minute

export default async function HomePage() {
  const [
    heroBanners,
    categories,
    brands,
    featuredProducts,
    bestSellers,
    newArrivals,
  ] = await Promise.all([
    getActiveBanners('hero'),
    getActiveCategories(),
    getActiveBrands(),
    getFeaturedProducts(8),
    getBestSellerProducts(8),
    getNewArrivalProducts(8),
  ]);

  // Combine top picks: prioritize bestSellers or featured
  const topPicks = bestSellers.length > 0 ? bestSellers : featuredProducts;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Banner Slider */}
      <HeroBanner banners={heroBanners} />

      {/* 2. Shop By Category */}
      <CategorySection categories={categories} />

      {/* 3. Shop By Brand */}
      <BrandSection brands={brands} />

      {/* 4. TOP PICKS / Best Selling Tools */}
      <section className="py-8 sm:py-12 lg:py-14 bg-white border-b border-neutral-200/70">
        <div className="container-site">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-1">
                <Flame size={14} className="fill-orange-500 text-orange-500 shrink-0" />
                <span>Best Selling Tools This Week</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight leading-none">
                TOP PICKS
              </h2>
            </div>
            <Link
              href="/shop?sort=popular"
              className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors shrink-0"
            >
              <span>View All</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {topPicks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {topPicks.map((product, idx) => (
                <ProductCard key={product.id} product={product} priority={idx < 4} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              <span className="text-4xl mb-3 block">⚙️</span>
              <h3 className="text-lg font-bold text-neutral-800 mb-1">Products will appear here</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-4">
                Add products from the Admin Panel or run seed data in Supabase SQL Editor.
              </p>
              <Link href="/admin" className="btn-primary text-xs">
                Go to Admin Panel
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. Promotional Industrial Mid-Banner */}
      <section className="py-12 sm:py-16 bg-neutral-950 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(#f97316 1px, transparent 1px), radial-gradient(#ffffff 1px, #000000 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />
        <div className="container-site relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block bg-orange-500 text-white font-black text-xs px-3 py-1 rounded tracking-wider uppercase mb-3">
              Special Pro Contractor Offer
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Heavy Duty Cordless Combo Kits
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 mt-3 mb-6 max-w-lg leading-relaxed">
              Upgrade your workshop with high-output 20V brushless hammer drills and angle grinders. 2-Year warranty on all brushless motors.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop?category=drills-drivers" className="btn-primary px-6 py-2.5 text-sm">
                Explore Combo Kits
              </Link>
              <Link href="/shop?sort=price-low" className="btn-secondary text-white border-white/40 hover:border-white px-6 py-2.5 text-sm">
                View Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. New Arrivals Section (if available) */}
      {newArrivals.length > 0 && (
        <section className="py-8 sm:py-12 lg:py-14 bg-neutral-50 border-b border-neutral-200/70">
          <div className="container-site">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Just Arrived In Stock</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 tracking-tight leading-none">
                  NEW ARRIVALS
                </h2>
              </div>
              <Link
                href="/shop?isNew=true"
                className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors shrink-0"
              >
                <span>View All</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Trust & Service Section */}
      <TrustSection />

      {/* 8. Why Choose TOOLSMAN */}
      <WhyChooseSection />

      {/* 9. Customer Reviews */}
      <TestimonialsSection />
    </div>
  );
}
