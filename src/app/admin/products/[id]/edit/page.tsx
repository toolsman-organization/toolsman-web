import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { createClient } from '@/lib/supabase/server';
import { getAllCategoriesAdmin } from '@/services/categories';
import { getAllBrandsAdmin } from '@/services/brands';
import type { ProductFullDetail } from '@/types/database';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Product | Admin TOOLSMAN',
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, categories, brands] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        specifications:product_specifications(*)
      `)
      .eq('id', id)
      .single(),
    getAllCategoriesAdmin(),
    getAllBrandsAdmin(),
  ]);

  if (productRes.error || !productRes.data) {
    console.error('[EditProductPage] Failed to fetch product:', productRes.error);
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProduct = productRes.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedImages = (rawProduct.images || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedSpecs = (rawProduct.specifications || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const product: ProductFullDetail = {
    ...rawProduct,
    images: sortedImages,
    specifications: sortedSpecs,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/products"
        className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} />
        Back to Products
      </Link>

      <div>
        <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
          Catalog Editor
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
          Edit Product: {product.name}
        </h1>
      </div>

      <ProductForm
        categories={categories}
        brands={brands}
        initialData={product}
      />
    </div>
  );
}
