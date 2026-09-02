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
        images:product_images(* ORDER BY sort_order ASC),
        specifications:product_specifications(* ORDER BY sort_order ASC)
      `)
      .eq('id', id)
      .single(),
    getAllCategoriesAdmin(),
    getAllBrandsAdmin(),
  ]);

  if (productRes.error || !productRes.data) {
    notFound();
  }

  const product = productRes.data as unknown as ProductFullDetail;

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
