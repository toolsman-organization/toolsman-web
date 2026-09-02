'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AnnouncementBar } from '@/types/database';

export default function AdminAnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<AnnouncementBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<AnnouncementBar | null>(null);

  const [form, setForm] = useState({
    message: '',
    linkText: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcement_bars')
      .select('*')
      .order('sort_order', { ascending: true });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const openAddModal = () => {
    setEditingAnnounce(null);
    setForm({
      message: '🚚 Delivery Across Kerala',
      linkText: '',
      linkUrl: '',
      sortOrder: announcements.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (a: AnnouncementBar) => {
    setEditingAnnounce(a);
    setForm({
      message: a.message,
      linkText: a.link_text || '',
      linkUrl: a.link_url || '',
      sortOrder: a.sort_order,
      isActive: a.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message) return;
    setSubmitting(true);

    const payload = {
      message: form.message,
      link_text: form.linkText || null,
      link_url: form.linkUrl || null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
    };

    if (editingAnnounce) {
      await supabase.from('announcement_bars').update(payload).eq('id', editingAnnounce.id);
    } else {
      await supabase.from('announcement_bars').insert(payload);
    }

    setSubmitting(false);
    setModalOpen(false);
    await loadAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    await supabase.from('announcement_bars').delete().eq('id', id);
    await loadAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Top Ticker & Announcements
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Announcement Bars ({announcements.length})
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Message</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : announcements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">CTA Link</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      {a.message}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.link_text ? (
                        <span className="font-bold text-orange-600">
                          {a.link_text} <span className="text-neutral-400 font-normal">({a.link_url})</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-700">
                      {a.sort_order}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-pill ${a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                        {a.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(a)}
                          className="p-1.5 text-neutral-600 hover:text-orange-600 rounded hover:bg-orange-50"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
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
            No announcement bars configured.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingAnnounce ? 'Edit Announcement' : 'Add Announcement Bar'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Message Text *
                </label>
                <input
                  type="text"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Free Delivery Above ₹999 Across Kerala"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.linkText}
                    onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                    placeholder="Shop Now"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
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
                  {submitting ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
