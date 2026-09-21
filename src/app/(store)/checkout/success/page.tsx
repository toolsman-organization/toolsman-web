import Link from 'next/link';
import { CheckCircle2, ArrowRight, Package, MapPin, Truck, Phone } from 'lucide-react';
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
    <div className="bg-neutral-50/60 min-h-[75vh] flex items-center justify-center py-12 sm:py-16">
      <div className="container-site max-w-xl">
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-12 shadow-sm text-center">

          {/* Success Check Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={40} className="stroke-[2.5]" />
          </div>

          <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-widest block mb-1">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight uppercase mb-2">
            Thank You For Your Order!
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto mb-8 leading-relaxed">
            Your order has been received and is being processed for fast dispatch.
          </p>

          {/* Clean Order Details Box */}
          <div className="bg-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 text-left text-xs space-y-3 mb-8">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200/80 font-bold">
              <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Order Number</span>
              <span className="font-mono text-sm text-neutral-900 font-extrabold">{order?.order_number || orderNumber || 'TM-ORDER'}</span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span>Date</span>
              <span className="font-bold text-neutral-900">{order?.created_at ? formatDate(order.created_at) : 'Today'}</span>
            </div>

            <div className="flex justify-between items-center text-neutral-600">
              <span>Payment Method</span>
              <span className="font-bold text-neutral-900 uppercase">
                Razorpay Online Payment
              </span>
            </div>

            {shippingAddress && (
              <div className="flex justify-between items-start text-neutral-600 pt-1">
                <span className="shrink-0 mr-4">Deliver To</span>
                <span className="font-medium text-neutral-900 text-right leading-tight max-w-[240px] truncate">
                  {shippingAddress}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200/80 font-bold">
              <span className="text-neutral-900 text-sm">Total Amount</span>
              <span className="font-black text-base text-orange-600">{order ? formatCurrency(order.total_amount) : ''}</span>
            </div>
          </div>

          {/* Simple Info Row */}
          <div className="flex items-center justify-center gap-6 text-[11px] text-neutral-500 mb-8">
            <div className="flex items-center gap-1.5 font-medium">
              <Truck size={14} className="text-orange-500" />
              <span>Fast Dispatch (2-4 Days)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Phone size={14} className="text-emerald-600" />
              <span>Helpline: +91 79944 10167</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/track-order?order=${order?.order_number || orderNumber || ''}`}
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
            >
              <Package size={16} />
              <span>Track Live Status</span>
            </Link>

            <Link
              href="/account/orders"
              className="btn-secondary py-3 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>My Orders</span>
            </Link>

            <Link
              href="/shop"
              className="btn-secondary py-3 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}


