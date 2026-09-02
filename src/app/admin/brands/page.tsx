'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import { slugify } from '@/lib/utils';
import type { Brand } from '@/types/database';

export default function AdminBrandsPage() {
  const supabase = createClient();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    cloudinaryPublicId: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order', { ascending: true });
    setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openAddModal = () => {
    setEditingBrand(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      cloudinaryPublicId: '',
      sortOrder: brands.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (b: Brand) => {
    setEditingBrand(b);
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description || '',
      logoUrl: b.logo_url || '',
      cloudinaryPublicId: b.cloudinary_public_id || '',
      sortOrder: b.sort_order,
      isActive: b.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSubmitting(true);

    const payload = {
      name: form.name,
      slug: slugify(form.slug),
      description: form.description || null,
      logo_url: form.logoUrl || null,
      cloudinary_public_id: form.cloudinaryPublicId || null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
    };

    if (editingBrand) {
      await supabase.from('brands').update(payload).eq('id', editingBrand.id);
    } else {
      await supabase.from('brands').insert(payload);
    }

    setSubmitting(false);
    setModalOpen(false);
    await loadBrands();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete brand "${name}"? Products will become unassigned.`)) return;
    await supabase.from('brands').delete().eq('id', id);
    await loadBrands();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Brand Partners
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Brands ({brands.length})
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Brand</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : brands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Logo</th>
                  <th className="py-3 px-4">Brand Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Sort Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-16 h-8 rounded bg-neutral-50 border border-neutral-200 p-1 flex items-center justify-center">
                        {b.logo_url ? (
                          <Image src={b.logo_url} alt={b.name} fill className="object-contain p-1" />
                        ) : (
                          <Tag size={16} className="text-neutral-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {b.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                      {b.slug}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-700">
                      {b.sort_order}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-pill ${b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                        {b.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-neutral-600 hover:text-orange-600 rounded hover:bg-orange-50"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 text-neutral-600 hover:text-red-600 rounded hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400 text-xs">
            No brands registered yet.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. INGCO"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono focus:outline-none focus:border-orange-500"
                  placeholder="e.g. ingco"
                />
              </div>

              <div>
                <ImageUploader
                  label="Brand Logo"
                  value={form.logoUrl}
                  folder="toolsman/brands"
                  onChange={(url, publicId) =>
                    setForm({ ...form, logoUrl: url, cloudinaryPublicId: publicId || '' })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
