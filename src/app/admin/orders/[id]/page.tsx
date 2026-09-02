import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { getOrderById } from '@/services/orders';
import { formatCurrency, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';
import OrderStatusUpdater from './OrderStatusUpdater';

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Order Details | Admin TOOLSMAN',
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
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

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/orders"
        className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} />
        Back to All Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
            Order Reference
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono mt-0.5">
            {order.order_number}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Submitted on {formatDateTime(order.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`status-pill ${getOrderStatusColor(order.order_status)} text-xs px-3 py-1 font-bold`}>
            Status: {order.order_status}
          </span>
          <span className={`status-pill ${getPaymentStatusColor(order.payment_status)} text-xs px-3 py-1 font-bold`}>
            Payment: {order.payment_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items and Addresses (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Purchased Items Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100">
              Ordered Products ({order.order_items?.length || 0})
            </h2>

            <div className="divide-y divide-neutral-100">
              {order.order_items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-lg bg-neutral-50 p-2 shrink-0 border border-neutral-100 flex items-center justify-center">
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
                    <div className="font-mono text-[10px] text-neutral-400 font-bold">
                      SKU: {item.product_code}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                    </div>
                  </div>

                  <div className="font-black text-sm text-neutral-950">
                    {formatCurrency(item.total_price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-4 mt-4 border-t border-neutral-100 flex flex-col gap-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({order.coupon_code})</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-bold text-neutral-900">{order.shipping_amount === 0 ? 'FREE' : formatCurrency(order.shipping_amount)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-black text-base text-neutral-950">
                <span>Total Amount Paid/Due</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100">
              Customer & Shipping Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-700">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Customer
                </span>
                <strong className="text-sm text-neutral-900 block font-bold">{order.customer_name}</strong>
                <p className="text-neutral-500">{order.customer_email || 'No email'}</p>
                <p className="text-neutral-900 font-bold mt-1">Phone: {order.customer_phone}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Shipping Address
                </span>
                <p>{address.address_line_1}</p>
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                <p>{address.city}, {address.district}, {address.state} - {address.pincode}</p>
                {address.landmark && <p className="text-neutral-400 mt-1">Landmark: {address.landmark}</p>}
              </div>

              {order.razorpay_payment_id && (
                <div className="sm:col-span-2 pt-3 border-t border-neutral-100">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Razorpay Transaction Details
                  </span>
                  <p className="font-mono text-xs">Payment ID: <strong className="text-neutral-900">{order.razorpay_payment_id}</strong></p>
                  {order.razorpay_order_id && (
                    <p className="font-mono text-xs text-neutral-500">Order ID: {order.razorpay_order_id}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status Updater & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Updater */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.order_status}
            customerEmail={order.customer_email}
            customerName={order.customer_name}
            orderNumber={order.order_number}
          />

          {/* Status Timeline History */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 text-xs font-bold text-neutral-900 uppercase tracking-wider">
              <Clock size={16} className="text-orange-600" />
              <span>Fulfillment History</span>
            </div>

            {order.status_history && order.status_history.length > 0 ? (
              <div className="space-y-4">
                {order.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-bold text-neutral-900 capitalize">{hist.status}</div>
                      {hist.note && <div className="text-neutral-600 mt-0.5">{hist.note}</div>}
                      <div className="text-[10px] text-neutral-400 mt-0.5">{formatDateTime(hist.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No status updates logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
