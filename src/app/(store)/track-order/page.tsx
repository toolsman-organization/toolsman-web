'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatFulfillmentStatusLabel,
  formatPaymentStatusLabel,
} from '@/lib/utils';
import type { OrderWithItems } from '@/types/database';

const TRACKING_STEPS = ['awaiting_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];

const STEP_LABELS: Record<string, string> = {
  awaiting_payment: 'Order Placed',
  pending:          'Order Placed',
  confirmed:        'Confirmed',
  processing:       'Processing',
  packed:           'Packed & Ready',
  shipped:          'Dispatched',
  delivered:        'Delivered',
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('order') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [order, setOrder] = useState<OrderWithItems | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!orderNumber.trim() || !identifier.trim()) {
      setErrorMsg('Please enter both Order Number and your Phone Number or Email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          identifier: identifier.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to find order details.');
      }

      setOrder(data.order);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Could not find order. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus and auto-track if query params provided
  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const currentStepIndex = order ? TRACKING_STEPS.indexOf(order.order_status) : -1;
  const address = order
    ? ((order.shipping_address || {}) as {
        full_name?: string;
        phone?: string;
        address_line_1?: string;
        address_line_2?: string;
        city?: string;
        district?: string;
        state?: string;
        pincode?: string;
        landmark?: string;
      })
    : null;

  return (
    <div className="bg-neutral-50/60 min-h-screen py-8 sm:py-14 border-b border-neutral-200">
      <div className="container-site max-w-4xl">
        {/* Page Header */}
        <div className="text-center max-w-lg mx-auto mb-8 sm:mb-10">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">
            Real-Time Updates
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Enter your Order Reference Number and registered phone number or email to view live status.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Order Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TM-202609-1234"
                    className="w-full pl-3.5 pr-4 py-3 rounded-xl border border-neutral-300 font-mono text-sm uppercase focus:outline-none focus:border-orange-500 font-bold placeholder:font-sans placeholder:font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Phone Number or Email *
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or email@example.com"
                  className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Searching Order Records...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Track Live Order Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Results View */}
        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Main Status Header Card */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      Verified Order
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500 font-medium">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-neutral-950 font-mono mt-1">
                    {order.order_number}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`status-pill ${getPaymentStatusColor(order.payment_status)} text-xs px-3 py-1 font-bold`}>
                    Payment: {formatPaymentStatusLabel(order.payment_status)}
                  </span>
                  <span className={`status-pill ${getOrderStatusColor(order.order_status)} text-xs px-3 py-1 font-bold`}>
                    Fulfillment: {formatFulfillmentStatusLabel(order.order_status)}
                  </span>
                </div>
              </div>

              {order.payment_status !== 'paid' && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Payment Status: {formatPaymentStatusLabel(order.payment_status)}.</span>{' '}
                    Your order is safely recorded. Fulfillment and dispatch will begin as soon as payment is confirmed.
                  </div>
                </div>
              )}

              {/* Visual Progress Stepper */}
              {order.order_status !== 'cancelled' && (
                <div className="pt-8 pb-4">
                  <div className="relative max-w-2xl mx-auto">
                    {/* Connecting Bar */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-neutral-200 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-4 left-4 h-1 bg-orange-500 -translate-y-1/2 z-0 transition-all duration-700"
                      style={{
                        width: `calc(${((Math.max(0, currentStepIndex)) / (TRACKING_STEPS.length - 1)) * 100}% - 2rem)`,
                      }}
                    />

                    {/* Steps list */}
                    <div className="relative z-10 flex justify-between items-start">
                      {TRACKING_STEPS.map((stepKey, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={stepKey} className="flex flex-col items-center text-center max-w-[70px]">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                isCurrent
                                  ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-100 scale-110'
                                  : isCompleted
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white border-2 border-neutral-300 text-neutral-400'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold mt-2 leading-tight ${
                                isCompleted ? 'text-neutral-900' : 'text-neutral-400'
                              }`}
                            >
                              {STEP_LABELS[stepKey] || stepKey}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Two Column Details: Items & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Ordered Items (7 cols) */}
              <div className="md:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-orange-600" />
                    <h3 className="font-black text-sm text-neutral-950 uppercase tracking-wider">
                      Ordered Tools ({order.order_items?.length || 0})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-neutral-500">
                    Total: {formatCurrency(order.total_amount)}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100 mb-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center gap-3.5">
                      <div className="relative w-14 h-14 rounded-xl bg-neutral-50 p-1.5 shrink-0 border border-neutral-200/80 overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                            🛠️
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-neutral-900 line-clamp-2 leading-snug">
                          {item.product_name}
                        </h4>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-400 font-bold">
                            SKU: {item.product_code}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                        </div>
                      </div>

                      <div className="font-black text-xs sm:text-sm text-neutral-950 shrink-0">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2 text-xs text-neutral-600">
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
                    <span className="font-bold text-neutral-900">{formatCurrency(order.shipping_amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-black text-base text-neutral-950">
                    <span>Grand Total</span>
                    <span className="text-orange-600 font-mono">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Address, Payment & Timeline (5 cols) */}
              <div className="md:col-span-5 flex flex-col gap-6">
                {/* Shipping & Payment Card */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    <MapPin size={16} className="text-orange-600" />
                    <span>Delivery Destination</span>
                  </div>

                  {address && (
                    <div className="text-xs text-neutral-700 space-y-1 leading-relaxed">
                      <strong className="block font-bold text-neutral-900 text-sm">{address.full_name}</strong>
                      <p>{address.address_line_1}</p>
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>{address.city}, {address.district}, {address.state} - {address.pincode}</p>
                      <p className="font-bold text-neutral-900 pt-1">Phone: {address.phone}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                      <CreditCard size={15} className="text-orange-600" />
                      <span>Razorpay Online Payment</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Gateway Status</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px]">
                        {order.payment_status === 'paid' ? 'Paid & Verified' : order.payment_status}
                      </span>
                    </div>
                    {order.razorpay_payment_id && (
                      <div className="mt-1.5 text-[11px] font-mono text-neutral-500">
                        Ref: {order.razorpay_payment_id}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline History */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    <Clock size={16} className="text-orange-600" />
                    <span>Order Progress Log</span>
                  </div>

                  {order.status_history && order.status_history.length > 0 ? (
                    <div className="space-y-3.5">
                      {order.status_history.map((hist, idx) => (
                        <div key={hist.id || idx} className="flex gap-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          <div>
                            <div className="font-bold text-neutral-900 capitalize">{hist.status}</div>
                            {hist.note && <div className="text-neutral-500 mt-0.5">{hist.note}</div>}
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {formatDateTime(hist.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">Your order has been received and is being prepared for dispatch.</p>
                  )}
                </div>

                {/* Quick Help Card */}
                <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block mb-1">
                    Need Dispatch Support?
                  </span>
                  <p className="text-xs text-neutral-300 mb-3">
                    Contact our Kerala fulfillment helpline directly for urgent queries.
                  </p>
                  <a
                    href="tel:+917994410167"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Phone size={14} className="text-orange-400" />
                    <span>+91 79944 10167</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-xs font-bold text-neutral-500">Loading Order Tracker...</p>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
