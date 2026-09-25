import Link from 'next/link';
import { CheckCircle2, ArrowRight, Package, Truck, Phone } from 'lucide-react';
import { getOrderByNumber } from '@/services/orders';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
  }>;
}

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber } = await searchParams;

  let order = null;
  if (orderNumber) {
    order = await getOrderByNumber(orderNumber);
  }

  const shippingAddress = order
    ? [
        order.shipping_address?.address_line_1,
        order.shipping_address?.address_line_2,
        order.shipping_address?.city,
        order.shipping_address?.state,
        order.shipping_address?.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="bg-neutral-50/70 min-h-[65vh] flex items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-lg shadow-neutral-900/5 p-5 sm:p-7 relative overflow-hidden text-center">
          
          {/* Top Brand Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 absolute top-0 left-0" />

          {/* Success Check Icon */}
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-emerald-200/60 shadow-xs">
            <CheckCircle2 size={26} className="stroke-[2.5]" />
          </div>

          <span className="inline-block text-[10px] font-extrabold text-orange-600 uppercase tracking-widest mb-1 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
            Order Confirmed
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight uppercase mb-1">
            Thank You For Your Order!
          </h1>

          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4 leading-relaxed">
            Your order has been received and is being processed for fast dispatch.
          </p>

          {/* Compact Order Details Box */}
          <div className="bg-neutral-50/80 rounded-xl p-3.5 sm:p-4 border border-neutral-200/70 text-left text-xs space-y-2 mb-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200/70 font-semibold">
              <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Order Number</span>
              <span className="font-mono text-xs font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                {order?.order_number || orderNumber || 'TM-ORDER'}
              </span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span>Date</span>
              <span className="font-semibold text-neutral-900">{order?.created_at ? formatDate(order.created_at) : 'Today'}</span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span>Payment Method</span>
              <span className="font-semibold text-neutral-900 uppercase text-[11px]">
                Razorpay Online Payment
              </span>
            </div>

            {shippingAddress && (
              <div className="flex justify-between items-start text-neutral-600 pt-0.5">
                <span className="shrink-0 mr-3">Deliver To</span>
                <span className="font-medium text-neutral-900 text-right leading-tight max-w-[220px] truncate">
                  {shippingAddress}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200/70 font-bold">
              <span className="text-neutral-900 text-xs">Total Amount</span>
              <span className="font-black text-sm sm:text-base text-orange-600 font-mono">
                {order ? formatCurrency(order.total_amount) : 'Paid'}
              </span>
            </div>
          </div>

          {/* Compact Support / Dispatch Row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-[11px] text-neutral-500 mb-4 pb-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Truck size={13} className="text-orange-500" />
              <span>Fast Dispatch (2-4 Days)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Phone size={13} className="text-emerald-600" />
              <span>Helpline: +91 79944 10167</span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href={`/track-order?order=${order?.order_number || orderNumber || ''}`}
              className="btn-primary py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20"
            >
              <Package size={14} />
              <span>Track Live Status</span>
            </Link>

            <Link
              href="/account/orders"
              className="btn-secondary py-2.5 px-3 text-xs font-bold flex items-center justify-center"
            >
              <span>My Orders</span>
            </Link>

            <Link
              href="/shop"
              className="btn-secondary py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={13} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
