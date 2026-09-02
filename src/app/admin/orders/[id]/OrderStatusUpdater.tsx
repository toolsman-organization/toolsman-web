'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/types/database';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  customerEmail?: string | null;
  customerName: string;
  orderNumber: string;
}

const statusOptions: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
  customerEmail,
  customerName,
  orderNumber,
}: OrderStatusUpdaterProps) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <h3 className="font-black text-base text-neutral-900 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100">
        Update Order Fulfillment Status
      </h3>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold bg-white text-neutral-900 capitalize focus:outline-none focus:border-orange-500"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
          disabled={loading || status === currentStatus}
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
