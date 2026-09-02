'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Trash2, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CustomerAddress } from '@/types/database';

const keralaDistricts = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad',
];

export default function AddressesPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Malappuram',
    state: 'Kerala',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

  const loadAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      await supabase.from('customer_addresses').insert({
        user_id: user.id,
        full_name: form.fullName,
        phone: form.phone,
        address_line_1: form.addressLine1,
        address_line_2: form.addressLine2 || null,
        city: form.city,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        landmark: form.landmark || null,
        is_default: form.isDefault,
      });

      setShowAddModal(false);
      setForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: 'Malappuram',
        state: 'Kerala',
        pincode: '',
        landmark: '',
        isDefault: false,
      });
      await loadAddresses();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    await supabase.from('customer_addresses').delete().eq('id', id);
    await loadAddresses();
  };

  return (
    <div className="bg-neutral-50/50 min-h-screen py-8 sm:py-12 border-b border-neutral-200">
      <div className="container-site max-w-4xl">
        <Link href="/account" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to Account
        </Link>

        <div className="flex items-center justify-between pb-4 mb-8 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Address Book
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              MY ADDRESSES ({addresses.length})
            </h1>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Add New Address</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-neutral-900">
                      {addr.full_name}
                    </span>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {addr.address_line_1}
                    {addr.address_line_2 && <>, {addr.address_line_2}</>}
                    <br />
                    {addr.city}, {addr.district}, {addr.state} - {addr.pincode}
                    {addr.landmark && <><br /><span className="text-neutral-400">Landmark: {addr.landmark}</span></>}
                  </p>
                  <p className="text-xs font-bold text-neutral-900 mt-2">
                    Phone: {addr.phone}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <MapPin size={44} className="mx-auto text-neutral-300 mb-3" />
            <h2 className="text-lg font-bold text-neutral-800 mb-1">No addresses saved</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              Add your delivery address to speed up checkout.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">
              Add New Address
            </button>
          </div>
        )}

        {/* Add Address Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
                Add Delivery Address
              </h2>

              <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">District *</label>
                  <select
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 bg-white"
                  >
                    {keralaDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Set as default delivery address</span>
                  </label>
                </div>

                <div className="sm:col-span-2 flex gap-3 pt-4 border-t border-neutral-200 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-300 font-bold text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary py-2.5 px-4 font-bold"
                  >
                    {submitting ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
