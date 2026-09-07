import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/storefront/ProductCard';
import FilterSidebar from '@/components/storefront/FilterSidebar';
import SortDropdown from '@/components/storefront/SortDropdown';
import { getProducts } from '@/services/products';
import { getActiveCategories } from '@/services/categories';
import { getActiveBrands } from '@/services/brands';
import type { Metadata } from 'next';

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    search?: string;
    sort?: 'price-low' | 'price-high' | 'newest' | 'popular';
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  let title = 'Shop All Professional Power Tools';
  if (params.category) title = `${params.category.replace(/-/g, ' ')} | TOOLSMAN`;
  if (params.brand) title = `${params.brand.toUpperCase()} Power Tools | TOOLSMAN`;
  if (params.search) title = `Search: "${params.search}" | TOOLSMAN`;

  return {
    title,
    description: 'Browse our extensive catalog of power tools, hand tools, accessories and spares with fast delivery in Kerala.',
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = 16;

  const filters = {
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    inStock: params.inStock === 'true',
    search: params.search,
    sort: params.sort || 'newest',
  };

  const [productsResult, categories, brands] = await Promise.all([
    getProducts(filters, page, limit),
    getActiveCategories(),
    getActiveBrands(),
  ]);

  const { data: products, total, totalPages } = productsResult;

  const activeCatObj = params.category
    ? categories.find((c) => c.slug === params.category)
    : null;
  const parentCatObj = activeCatObj?.parent_id
    ? categories.find((c) => c.id === activeCatObj.parent_id)
    : null;

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 border-b border-neutral-200">
      <div className="container-site">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <ChevronRight size={13} />
          <Link href="/shop" className="hover:text-orange-600 transition-colors font-semibold">Shop Catalog</Link>

          {parentCatObj && (
            <>
              <ChevronRight size={13} />
              <Link href={`/shop?category=${parentCatObj.slug}`} className="hover:text-orange-600 transition-colors font-semibold">
                {parentCatObj.name}
              </Link>
            </>
          )}

          {activeCatObj && (
            <>
              <ChevronRight size={13} />
              <span className="text-orange-600 font-bold">{activeCatObj.name}</span>
            </>
          )}

          {!activeCatObj && params.category && (
            <>
              <ChevronRight size={13} />
              <span className="text-orange-600 font-bold capitalize">{params.category.replace(/-/g, ' ')}</span>
            </>
          )}

          {params.brand && (
            <>
              <ChevronRight size={13} />
              <span className="text-orange-600 font-bold uppercase">{params.brand}</span>
            </>
          )}
        </nav>

        {/* Page Title & Count */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              {params.search
                ? `Search Results: "${params.search}"`
                : activeCatObj
                ? activeCatObj.name
                : params.category
                ? params.category.replace(/-/g, ' ')
                : 'All Professional Tools'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Showing <span className="font-bold text-neutral-900">{products.length}</span> of{' '}
              <span className="font-bold text-neutral-900">{total}</span> products
            </p>
          </div>

          {/* Interactive Reactive Sort Controller */}
          <SortDropdown currentSort={params.sort} />
        </div>

        {/* Main Content: Sidebar + Products Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Filter Sidebar */}
          <FilterSidebar categories={categories} brands={brands} />

          {/* Products Grid */}
          <div className="flex-1 w-full">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const query = new URLSearchParams();
                      if (params.category) query.set('category', params.category);
                      if (params.brand) query.set('brand', params.brand);
                      if (params.search) query.set('search', params.search);
                      if (params.minPrice) query.set('minPrice', params.minPrice);
                      if (params.maxPrice) query.set('maxPrice', params.maxPrice);
                      if (params.inStock) query.set('inStock', params.inStock);
                      if (params.sort) query.set('sort', params.sort);
                      query.set('page', p.toString());

                      return (
                        <Link
                          key={p}
                          href={`/shop?${query.toString()}`}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            p === page
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-white border border-neutral-200 text-neutral-700 hover:border-orange-500'
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
                <SlidersHorizontal size={40} className="mx-auto text-neutral-400 mb-3" />
                <h3 className="text-lg font-bold text-neutral-800 mb-1">No products found</h3>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mb-6">
                  We couldn&apos;t find any products matching your current filters or search query.
                </p>
                <Link href="/shop" className="btn-primary text-xs">
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
