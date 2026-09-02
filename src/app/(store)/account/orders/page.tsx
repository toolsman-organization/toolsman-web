import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, ArrowLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserOrders } from '@/services/orders';
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/account/orders');

  const orders = await getUserOrders(user.id);

  return (
    <div className="bg-neutral-50/50 min-h-screen py-8 sm:py-12 border-b border-neutral-200">
      <div className="container-site max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/account" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to Account
          </Link>
        </div>

        <div className="flex items-center justify-between pb-4 mb-8 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Purchase History
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              MY ORDERS ({orders.length})
            </h1>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-sm hover:border-neutral-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Package size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm sm:text-base text-neutral-950">
                        {order.order_number}
                      </span>
                      <span className={`status-pill ${getOrderStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                      <span className={`status-pill ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Ordered on {formatDate(order.created_at)} • Payment via {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-neutral-400 block font-semibold">Total Amount</span>
                    <span className="font-black text-base text-neutral-950">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1"
                  >
                    <span>View Order</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <Package size={44} className="mx-auto text-neutral-300 mb-3" />
            <h2 className="text-lg font-bold text-neutral-800 mb-1">No orders found</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              When you order tools, they will appear here with full tracking updates.
            </p>
            <Link href="/shop" className="btn-primary text-xs">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
