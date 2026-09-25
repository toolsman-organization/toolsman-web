import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/storefront/ProductCard';
import FilterSidebar from '@/components/storefront/FilterSidebar';
import SortDropdown from '@/components/storefront/SortDropdown';
import { getProducts } from '@/services/products';
import { getActiveCategories, getCategoryBySlug } from '@/services/categories';
import { getActiveBrands } from '@/services/brands';
import { getSiteUrl, getAbsoluteUrl } from '@/lib/site-url';
import { generateBreadcrumbSchema, generateCollectionPageSchema } from '@/lib/schema';
import type { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: 'price-low' | 'price-high' | 'newest' | 'popular';
    page?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'Category Not Found | TOOLSMAN' };

  const parentName = category.parent ? category.parent.name + ' > ' : '';
  const pageNum = sp.page ? parseInt(sp.page, 10) : 1;
  const pageSuffix = pageNum > 1 ? ` (Page ${pageNum})` : '';

  const title = `${category.name}${pageSuffix} — Professional Power Tools | TOOLSMAN`;
  const description =
    category.description ||
    `Shop ${category.name} at TOOLSMAN. Browse our full range of ${parentName}${category.name.toLowerCase()} with fast delivery across Kerala. 100% authentic brands.`;

  const canonicalUrl = `/category/${slug}`;
  const hasFilterParams = Boolean(sp.minPrice || sp.maxPrice || sp.sort || sp.inStock);

  const images = category.image_url
    ? [
        {
          url: category.image_url,
          width: 800,
          height: 800,
          alt: category.name,
        },
      ]
    : [];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: hasFilterParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(canonicalUrl),
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: category.image_url ? [category.image_url] : [],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = sp.page ? parseInt(sp.page, 10) : 1;
  const limit = 16;

  const [category, categories, brands] = await Promise.all([
    getCategoryBySlug(slug),
    getActiveCategories(),
    getActiveBrands(),
  ]);

  if (!category) notFound();

  const filters = {
    category: slug,
    brand: sp.brand,
    minPrice: sp.minPrice ? parseFloat(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    inStock: sp.inStock === 'true',
    sort: sp.sort || 'newest',
  };

  const { data: products, total, totalPages } = await getProducts(filters, page, limit);
  const parentCat = category.parent ?? null;

  // Build Breadcrumb JSON-LD
  const breadcrumbItems: { name: string; url?: string }[] = [
    { name: 'Home', url: '/' },
    { name: 'Shop Catalog', url: '/shop' },
  ];

  if (parentCat) {
    breadcrumbItems.push({
      name: parentCat.name,
      url: `/category/${parentCat.slug}`,
    });
  }

  breadcrumbItems.push({
    name: category.name,
    url: `/category/${category.slug}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const collectionSchema = generateCollectionPageSchema(
    category.name,
    category.description || `Browse our full range of ${category.name} at TOOLSMAN.`,
    `/category/${category.slug}`
  );

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 border-b border-neutral-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div className="container-site">
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <ChevronRight size={13} />
          <Link href="/shop" className="hover:text-orange-600 transition-colors font-semibold">Shop Catalog</Link>
          {parentCat && (
            <>
              <ChevronRight size={13} />
              <Link href={'/category/' + parentCat.slug} className="hover:text-orange-600 transition-colors font-semibold">
                {parentCat.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} />
          <span className="text-orange-600 font-bold">{category.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Showing <span className="font-bold text-neutral-900">{products.length}</span> of{' '}
              <span className="font-bold text-neutral-900">{total}</span> products
            </p>
          </div>
          <div className="hidden lg:block">
            <SortDropdown currentSort={sp.sort} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <FilterSidebar categories={categories} brands={brands} />
          <div className="flex-1 w-full">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const query = new URLSearchParams();
                      if (sp.brand) query.set('brand', sp.brand);
                      if (sp.minPrice) query.set('minPrice', sp.minPrice);
                      if (sp.maxPrice) query.set('maxPrice', sp.maxPrice);
                      if (sp.inStock) query.set('inStock', sp.inStock);
                      if (sp.sort) query.set('sort', sp.sort);
                      query.set('page', p.toString());
                      const qs = query.toString();
                      return (
                        <Link key={p} href={'/category/' + slug + (qs ? '?' + qs : '')}
                          className={'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ' + (p === page ? 'bg-orange-600 text-white shadow-md' : 'bg-white border border-neutral-200 text-neutral-700 hover:border-orange-500')}>
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
                  We could not find any products in this category matching your filters.
                </p>
                <Link href={'/category/' + slug} className="btn-primary text-xs">Clear Filters</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}