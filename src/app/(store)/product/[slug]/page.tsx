import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Star, Shield, Cpu, PackageCheck } from 'lucide-react';
import ProductGallery from '@/components/storefront/ProductGallery';
import ProductActions from '@/components/storefront/ProductActions';
import ProductCard from '@/components/storefront/ProductCard';
import { getProductBySlug, getRelatedProducts } from '@/services/products';
import { formatCurrency, calculateDiscount } from '@/lib/utils';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | TOOLSMAN',
    };
  }

  return {
    title: `${product.name} (${product.product_code}) | TOOLSMAN`,
    description: product.short_description || `Buy ${product.name} at best price with warranty in Kerala.`,
    openGraph: {
      title: `${product.name} | TOOLSMAN`,
      description: product.short_description || undefined,
      images: product.primary_image_url ? [{ url: product.primary_image_url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.category_id, 4);
  const discount = calculateDiscount(product.original_price, product.selling_price);

  return (
    <div className="bg-neutral-50/40 min-h-screen py-6 sm:py-10 border-b border-neutral-200">
      <div className="container-site">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <ChevronRight size={13} />
          <Link href="/shop" className="hover:text-orange-600 transition-colors">Shop</Link>
          {product.category && (
            <>
              <ChevronRight size={13} />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-orange-600 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} />
          <span className="text-neutral-900 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Showcase Section */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-8 shadow-sm mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Image Gallery (5 cols) */}
            <div className="lg:col-span-6 w-full">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Right: Product Details & Actions (7 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              {/* Brand, Badges & Code */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {product.brand && (
                    <Link
                      href={`/shop?brand=${product.brand.slug}`}
                      className="bg-neutral-900 text-white text-xs font-black px-2.5 py-1 rounded tracking-wider uppercase hover:bg-orange-600 transition-colors"
                    >
                      {product.brand.name}
                    </Link>
                  )}
                  {discount > 0 && (
                    <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-wide">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-neutral-500 font-bold bg-neutral-100 px-2 py-1 rounded">
                  SKU: {product.product_code}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Stock Status */}
              <div className="flex items-center gap-4 text-xs pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2 py-1 rounded-md font-bold border border-amber-200">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  <span>4.8</span>
                  <span className="text-neutral-500 font-normal">(24 Reviews)</span>
                </div>
                <span className="text-neutral-300">|</span>
                {product.stock_quantity > 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <PackageCheck size={16} className="text-emerald-600" />
                    In Stock ({product.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">Currently Out of Stock</span>
                )}
              </div>

              {/* Price Section */}
              <div className="flex items-baseline gap-3 py-1">
                <span className="text-3xl sm:text-4xl font-black text-neutral-950">
                  {formatCurrency(product.selling_price)}
                </span>
                {product.original_price > product.selling_price && (
                  <span className="text-lg text-neutral-400 line-through">
                    {formatCurrency(product.original_price)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    You save {formatCurrency(product.original_price - product.selling_price)}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Cart / Buy Now / Wishlist Interactive Form */}
              <ProductActions product={product} />
            </div>
          </div>
        </div>

        {/* Detailed Tabs / Description & Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Specifications Table (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-200">
              <Cpu className="text-orange-600 w-5 h-5" />
              <h2 className="text-lg font-black text-neutral-950 uppercase tracking-tight">
                Technical Specifications
              </h2>
            </div>

            {product.specifications && product.specifications.length > 0 ? (
              <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
                {product.specifications.map((spec) => (
                  <div key={spec.id} className="py-2.5 flex justify-between gap-4">
                    <span className="font-semibold text-neutral-500 w-1/2">{spec.specification_name}</span>
                    <span className="font-bold text-neutral-900 w-1/2 text-right">{spec.specification_value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Standard manufacturer industrial specifications apply.
              </p>
            )}
          </div>

          {/* Description & Overview (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-200">
              <Shield className="text-orange-600 w-5 h-5" />
              <h2 className="text-lg font-black text-neutral-950 uppercase tracking-tight">
                Product Overview & Features
              </h2>
            </div>
            <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
              {product.description || product.short_description || 'High-performance professional tool designed for rigorous job site applications.'}
            </div>
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight uppercase">
                Related Tools & Accessories
              </h2>
              <Link
                href={`/shop?category=${product.category?.slug || ''}`}
                className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                View Category
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
