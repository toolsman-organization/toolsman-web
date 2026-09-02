'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Banner } from '@/types/database';

export default function AdminBannersPage() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    cloudinaryPublicId: '',
    buttonText: '',
    buttonLink: '',
    position: 'hero' as 'hero' | 'promo' | 'sidebar',
    sortOrder: 0,
    isActive: true,
  });

  const loadBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openAddModal = () => {
    setEditingBanner(null);
    setForm({
      title: 'BUILT FOR THE JOB.',
      subtitle: 'Professional tools. Serious performance.',
      imageUrl: '',
      cloudinaryPublicId: '',
      buttonText: 'SHOP NOW',
      buttonLink: '/shop',
      position: 'hero',
      sortOrder: banners.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      imageUrl: b.image_url,
      cloudinaryPublicId: b.cloudinary_public_id || '',
      buttonText: b.button_text || '',
      buttonLink: b.button_link || '',
      position: b.position,
      sortOrder: b.sort_order,
      isActive: b.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) {
      alert('Please upload a banner image');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: form.title || null,
      subtitle: form.subtitle || null,
      image_url: form.imageUrl,
      cloudinary_public_id: form.cloudinaryPublicId || null,
      button_text: form.buttonText || null,
      button_link: form.buttonLink || null,
      position: form.position,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
    };

    if (editingBanner) {
      await supabase.from('banners').update(payload).eq('id', editingBanner.id);
    } else {
      await supabase.from('banners').insert(payload);
    }

    setSubmitting(false);
    setModalOpen(false);
    await loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    await loadBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Marketing & Visuals
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Homepage Banners ({banners.length})
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : banners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Title & Subtitle</th>
                  <th className="py-3 px-4">Button Action</th>
                  <th className="py-3 px-4">Position / Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-28 h-14 rounded-lg bg-neutral-900 border border-neutral-200 overflow-hidden">
                        <Image src={b.image_url} alt={b.title || 'Banner'} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-neutral-900 line-clamp-1">{b.title || 'Untitled Banner'}</div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1">{b.subtitle}</div>
                    </td>
                    <td className="py-3 px-4">
                      {b.button_text ? (
                        <div className="font-bold text-orange-600">
                          {b.button_text} <span className="text-neutral-400 font-normal">→ {b.button_link}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-700 uppercase">
                      {b.position} (Order: {b.sort_order})
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
                          onClick={() => handleDelete(b.id)}
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
            No banners created yet. The storefront will show the default industrial hero slide.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingBanner ? 'Edit Banner' : 'Add New Hero Banner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <ImageUploader
                  label="Banner Background Image *"
                  value={form.imageUrl}
                  folder="toolsman/banners"
                  onChange={(url, publicId) =>
                    setForm({ ...form, imageUrl: url, cloudinaryPublicId: publicId || '' })
                  }
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500 font-bold"
                  placeholder="e.g. BUILT FOR THE JOB."
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Professional tools. Serious performance."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 font-bold"
                    placeholder="SHOP NOW"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={form.buttonLink}
                    onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 font-mono"
                    placeholder="/shop"
                  />
                </div>
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
                    <span>Active on Homepage</span>
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
                  {submitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
