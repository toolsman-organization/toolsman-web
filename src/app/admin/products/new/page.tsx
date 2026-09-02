import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { getAllCategoriesAdmin } from '@/services/categories';
import { getAllBrandsAdmin } from '@/services/brands';

export const metadata = {
  title: 'Add New Product | Admin TOOLSMAN',
};

export default async function AddProductPage() {
  const [categories, brands] = await Promise.all([
    getAllCategoriesAdmin(),
    getAllBrandsAdmin(),
  ]);

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
          Catalog Creation
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
          Add New Power Tool
        </h1>
      </div>

      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
