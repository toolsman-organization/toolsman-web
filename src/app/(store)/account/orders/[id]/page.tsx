import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getOrderById } from '@/services/orders';
import { formatCurrency, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/account/orders/${id}`);

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  if (order.user_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      notFound();
    }
  }

  const address = (order.shipping_address || {}) as {
    full_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };

  const steps = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
  const currentStepIndex = steps.indexOf(order.order_status);

  return (
    <div className="bg-neutral-50/50 min-h-screen py-8 sm:py-12 border-b border-neutral-200">
      <div className="container-site max-w-4xl">
        <Link href="/account/orders" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to All Orders
        </Link>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">
                Order Reference
              </span>
              <h1 className="text-2xl font-black text-neutral-950 font-mono mt-0.5">
                {order.order_number}
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Placed on {formatDateTime(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`status-pill ${getOrderStatusColor(order.order_status)} text-xs px-3 py-1`}>
                {order.order_status}
              </span>
              <span className={`status-pill ${getPaymentStatusColor(order.payment_status)} text-xs px-3 py-1`}>
                Payment: {order.payment_status}
              </span>
            </div>
          </div>

          {/* Status Progress Bar (if not cancelled) */}
          {order.order_status !== 'cancelled' && currentStepIndex !== -1 && (
            <div className="pt-8 pb-4">
              <div className="flex items-center justify-between max-w-2xl mx-auto relative">
                {/* Connector line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-200 z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 z-0 transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((s, idx) => (
                  <div key={s} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        idx <= currentStepIndex
                          ? 'bg-orange-500 text-white shadow-md ring-4 ring-orange-100'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mt-2 capitalize hidden sm:block">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Purchased Items (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight pb-4 mb-4 border-b border-neutral-100">
              Purchased Items ({order.order_items?.length || 0})
            </h2>

            <div className="divide-y divide-neutral-100">
              {order.order_items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg bg-neutral-50 p-2 shrink-0 border border-neutral-100 flex items-center justify-center">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.product_name} fill className="object-contain p-1" />
                    ) : (
                      <span className="text-xl">🛠️</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-neutral-900 leading-snug">
                      {item.product_name}
                    </div>
                    <div className="font-mono text-[10px] text-neutral-400 font-bold mt-0.5">
                      SKU: {item.product_code}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                    </div>
                  </div>

                  <div className="font-black text-sm text-neutral-950">
                    {formatCurrency(item.total_price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-4 mt-4 border-t border-neutral-100 flex flex-col gap-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-bold text-neutral-900">{order.shipping_amount === 0 ? 'FREE' : formatCurrency(order.shipping_amount)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-black text-base text-neutral-950">
                <span>Total Amount</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Address & Timeline (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                <MapPin size={16} className="text-orange-600" />
                <span>Shipping Address</span>
              </div>
              <div className="text-xs text-neutral-700 leading-relaxed">
                <strong className="block font-bold text-neutral-900 text-sm mb-1">{address.full_name}</strong>
                <p>{address.address_line_1}</p>
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                <p>{address.city}, {address.district}, {address.state} - {address.pincode}</p>
                <p className="mt-2 font-bold text-neutral-900">Phone: {address.phone}</p>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                <Clock size={16} className="text-orange-600" />
                <span>Order Timeline</span>
              </div>

              {order.status_history && order.status_history.length > 0 ? (
                <div className="space-y-4">
                  {order.status_history.map((hist, idx) => (
                    <div key={hist.id || idx} className="flex gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-bold text-neutral-900 capitalize">{hist.status}</div>
                        {hist.note && <div className="text-neutral-500 mt-0.5">{hist.note}</div>}
                        <div className="text-[10px] text-neutral-400 mt-0.5">{formatDateTime(hist.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">No status updates recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
