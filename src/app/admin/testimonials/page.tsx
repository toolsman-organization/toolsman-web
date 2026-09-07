'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  MessageSquareQuote,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Testimonial } from '@/types/database';

export default function AdminTestimonialsPage() {
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);

  const [form, setForm] = useState({
    name: '',
    role: '',
    comment: '',
    rating: 5,
    verified: true,
    sortOrder: 0,
    isActive: true,
  });

  const loadTestimonials = async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTestimonials(data as Testimonial[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      role: '',
      comment: '',
      rating: 5,
      verified: true,
      sortOrder: testimonials.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      role: item.role || '',
      comment: item.comment,
      rating: item.rating,
      verified: item.verified,
      sortOrder: item.sort_order,
      isActive: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return;

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || null,
      comment: form.comment.trim(),
      rating: Number(form.rating) || 5,
      verified: form.verified,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert(payload);
        if (error) throw error;
      }

      setModalOpen(false);
      await loadTestimonials();
    } catch (err: unknown) {
      alert('Failed to save testimonial: ' + ((err as Error).message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Testimonial) => {
    if (!confirm(`Delete testimonial from "${item.name}"?`)) return;

    const { error } = await supabase.from('testimonials').delete().eq('id', item.id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    await loadTestimonials();
  };

  const handleToggleActive = async (item: Testimonial) => {
    await supabase.from('testimonials').update({ is_active: !item.is_active }).eq('id', item.id);
    await loadTestimonials();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Customer Social Proof & Trust
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Customer Testimonials ({testimonials.length})
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage real customer reviews that appear on the homepage review section.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Testimonial</span>
        </button>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-neutral-500 mt-2 font-semibold">Loading testimonials...</p>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-neutral-50 rounded-xl border border-neutral-200/90 p-4 sm:p-5 flex flex-col justify-between hover:border-orange-300 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < t.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-neutral-300'
                          }
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {t.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed mb-4">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                        {t.name}
                      </h4>
                      {t.verified && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                          <CheckCircle2 size={10} />
                          Verified
                        </span>
                      )}
                    </div>
                    {t.role && (
                      <p className="text-[11px] text-neutral-500 truncate">{t.role}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-neutral-500 hover:text-orange-600 rounded hover:bg-white transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 text-neutral-500 hover:text-red-600 rounded hover:bg-white transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-neutral-400 text-xs">
            <MessageSquareQuote className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-neutral-800 uppercase tracking-tight">No Testimonials Added Yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;+ Add Testimonial&quot; to publish your first customer review on the homepage.
            </p>
            <button onClick={openAddModal} className="btn-primary text-xs py-2 px-4 font-bold">
              + Add First Testimonial
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  placeholder="e.g. Firoz P."
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Customer Role / Location
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. General Contractor, Malappuram"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Star Rating (1 to 5) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={22}
                        className={
                          star <= form.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-neutral-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-700 ml-2">
                    {form.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Review / Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-orange-500"
                  placeholder="What did the customer say about TOOLSMAN products or service?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Verified Buyer</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Active on Store</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 font-bold shadow-md"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
