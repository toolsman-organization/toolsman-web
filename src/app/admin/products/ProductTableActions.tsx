'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ProductWithDetails } from '@/types/database';

export default function ProductTableActions({ product }: { product: ProductWithDetails }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    router.refresh();
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
    setLoading(true);
    await supabase.from('products').delete().eq('id', product.id);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-end gap-2 text-neutral-500">
      <Link
        href={`/product/${product.slug}`}
        target="_blank"
        className="p-1.5 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
        title="View on storefront"
      >
        <Eye size={15} />
      </Link>

      <button
        onClick={handleToggleActive}
        disabled={loading}
        className={`p-1.5 rounded-md hover:bg-neutral-100 ${
          product.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-neutral-400'
        }`}
        title={product.is_active ? 'Deactivate' : 'Activate'}
      >
        {product.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      </button>

      <Link
        href={`/admin/products/${product.id}/edit`}
        className="p-1.5 hover:text-orange-600 rounded-md hover:bg-orange-50"
        title="Edit product"
      >
        <Edit size={15} />
      </Link>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 hover:text-red-600 rounded-md hover:bg-red-50"
        title="Delete product"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
