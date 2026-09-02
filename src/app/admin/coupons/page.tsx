'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, TicketPercent } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Coupon } from '@/types/database';

export default function AdminCouponsPage() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
  });

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '10',
      minOrderAmount: '999',
      maxDiscount: '500',
      usageLimit: '100',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discount_type,
      discountValue: c.discount_value.toString(),
      minOrderAmount: c.minimum_order_amount.toString(),
      maxDiscount: c.maximum_discount?.toString() || '',
      usageLimit: c.usage_limit?.toString() || '',
      isActive: c.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) return;
    setSubmitting(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discountType,
      discount_value: parseFloat(form.discountValue),
      minimum_order_amount: parseFloat(form.minOrderAmount) || 0,
      maximum_discount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      usage_limit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      is_active: form.isActive,
    };

    if (editingCoupon) {
      await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
    } else {
      await supabase.from('coupons').insert(payload);
    }

    setSubmitting(false);
    setModalOpen(false);
    await loadCoupons();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await supabase.from('coupons').delete().eq('id', id);
    await loadCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Promotions & Discounts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Coupons ({coupons.length})
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min. Spend</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-black text-sm text-neutral-950">{c.code}</div>
                      <div className="text-[11px] text-neutral-500">{c.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                      {c.maximum_discount && (
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          Max: {formatCurrency(c.maximum_discount)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-800">
                      {formatCurrency(c.minimum_order_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-neutral-700">
                        {c.used_count} / {c.usage_limit || '∞'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-pill ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-neutral-600 hover:text-orange-600 rounded hover:bg-orange-50"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
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
            No active promo codes created.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono font-bold text-sm focus:outline-none focus:border-orange-500 uppercase"
                  placeholder="e.g. KERALA10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
                    placeholder={form.discountType === 'percentage' ? '10' : '500'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Min. Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                    placeholder="999"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Max. Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                    placeholder="Optional max cap"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. 10% Flat discount for Kerala contractor purchases"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Active & Redeemable</span>
                </label>
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
                  {submitting ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
