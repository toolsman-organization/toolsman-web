'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus, PaymentStatus } from '@/types/database';
import { formatFulfillmentStatusLabel } from '@/lib/utils';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  customerEmail?: string | null;
  customerName: string;
  orderNumber: string;
}

const allStatusOptions: { value: OrderStatus; label: string; requiresPaid: boolean }[] = [
  { value: 'awaiting_payment', label: 'Awaiting Payment', requiresPaid: false },
  { value: 'confirmed', label: 'Confirmed', requiresPaid: true },
  { value: 'processing', label: 'Processing', requiresPaid: true },
  { value: 'packed', label: 'Packed', requiresPaid: true },
  { value: 'shipped', label: 'Shipped', requiresPaid: true },
  { value: 'delivered', label: 'Delivered', requiresPaid: true },
  { value: 'cancelled', label: 'Cancelled', requiresPaid: false },
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  paymentStatus,
  customerEmail,
  customerName,
  orderNumber,
}: OrderStatusUpdaterProps) {
  const router = useRouter();
  const supabase = createClient();

  const isPaid = paymentStatus === 'paid';
  const initialStatus = (currentStatus === 'pending' ? 'awaiting_payment' : currentStatus) as OrderStatus;
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: Prevent advancing fulfillment for unpaid orders
    if (!isPaid && ['confirmed', 'processing', 'packed', 'shipped', 'delivered'].includes(status)) {
      alert('Cannot update fulfillment status for an unpaid order. Payment must be paid first.');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

      if (error) throw error;

      // Send Brevo email notification via internal API if email exists
      if (customerEmail) {
        fetch('/api/brevo/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'status_update',
            customerEmail,
            customerName,
            orderNumber,
            newStatus: status,
            note: note || undefined,
          }),
        }).catch(() => {});
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      alert((err as Error).message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      <h3 className="font-black text-base text-neutral-900 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100 flex items-center justify-between">
        <span>Fulfillment Status</span>
        {!isPaid && (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <Lock size={12} />
            Actions Restricted
          </span>
        )}
      </h3>

      {!isPaid && (
        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Payment pending</strong> — fulfillment actions (Processing, Packed, Shipped, Delivered) are unavailable until payment is successfully received.
          </span>
        </div>
      )}

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Set Fulfillment Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold bg-white text-neutral-900 capitalize focus:outline-none focus:border-orange-500"
          >
            {allStatusOptions.map((s) => {
              const disabled = !isPaid && s.requiresPaid;
              return (
                <option key={s.value} value={s.value} disabled={disabled}>
                  {s.label} {disabled ? '(Requires Paid Payment)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Status Note / Courier Tracking (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Dispatched via Professional Courier AWB #123456"
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || status === currentStatus || (!isPaid && ['confirmed', 'processing', 'packed', 'shipped', 'delivered'].includes(status))}
          className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            <CheckCircle size={16} />
          ) : (
            <RefreshCw size={16} />
          )}
          <span>{success ? 'Status Updated!' : 'Update Status & Notify Customer'}</span>
        </button>
      </div>
    </form>
  );
}
