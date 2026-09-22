'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight, AlertTriangle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ProductWithDetails } from '@/types/database';

export default function ProductTableActions({ product }: { product: ProductWithDetails }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleToggleActive = async () => {
    setLoading(true);
    await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    router.refresh();
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setDeleteError('');
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      setDeleteError('Failed to delete product. Please try again.');
      setLoading(false);
      return;
    }
    setShowDeleteModal(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
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
          onClick={() => { setShowDeleteModal(true); setDeleteError(''); }}
          disabled={loading}
          className="p-1.5 hover:text-red-600 rounded-md hover:bg-red-50"
          title="Delete product"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-950 uppercase tracking-tight">Delete Product</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <p className="text-sm text-neutral-700 mb-2">
              Are you sure you want to permanently delete:
            </p>
            <p className="text-sm font-bold text-neutral-950 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mb-4 line-clamp-2">
              {product.name}
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 font-medium mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                disabled={loading}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
