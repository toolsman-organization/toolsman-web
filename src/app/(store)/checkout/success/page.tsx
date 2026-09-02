import Link from 'next/link';
import { CheckCircle2, ArrowRight, Package, Truck, Phone } from 'lucide-react';
import { getOrderByNumber } from '@/services/orders';
import { formatCurrency } from '@/lib/utils';

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

  return (
    <div className="bg-neutral-50/50 min-h-[75vh] py-12 sm:py-16 border-b border-neutral-200">
      <div className="container-site max-w-2xl text-center">
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 shadow-sm">
          {/* Animated Success Badge */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
            <CheckCircle2 size={44} className="stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Order Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight mt-1 mb-3">
            Thank You for Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mb-6 leading-relaxed">
            Your tools are being processed for prompt dispatch. We have sent confirmation details to your email.
          </p>

          {/* Order Details Card */}
          {order && (
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/80 text-left text-xs mb-8 flex flex-col gap-3">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200 font-bold">
                <span className="text-neutral-500">Order Number</span>
                <span className="font-mono text-sm text-neutral-900">{order.order_number}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Payment Method</span>
                <span className="font-bold text-neutral-900 uppercase">{order.payment_method}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Payment Status</span>
                <span className="font-bold text-emerald-700 capitalize">{order.payment_status}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Total Amount Paid</span>
                <span className="font-black text-sm text-neutral-950">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          )}

          {/* Fast Delivery Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs mb-8">
            <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-start gap-2.5">
              <Truck size={16} className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 block font-bold">Fast Tracking</strong>
                <span className="text-neutral-600 text-[11px]">Track real-time status in your account dashboard.</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-start gap-2.5">
              <Phone size={16} className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 block font-bold">Need Assistance?</strong>
                <span className="text-neutral-600 text-[11px]">Call our team at +91 79944 10167 anytime.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/orders"
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
            >
              <Package size={16} />
              <span>View My Orders</span>
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
