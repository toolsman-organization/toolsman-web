'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import { ShieldCheck, MapPin, CreditCard, Truck, Loader2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { CustomerAddress } from '@/types/database';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const keralaDistricts = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod',
  'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad',
  'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad',
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('coupon') || '';

  const { items, cartTotal, clearCart, loading: cartLoading } = useCart();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Address Form State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Tirur',
    district: 'Malappuram',
    state: 'Kerala',
    pincode: '676552',
    landmark: 'Puthanathani',
  });

  // Payment Option
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // Coupon State
  const [couponDiscount, setCouponDiscount] = useState(0);

  const shippingFee = cartTotal >= 999 || cartTotal === 0 ? 0 : 99;
  const grandTotal = Math.max(0, cartTotal - couponDiscount + shippingFee);

  // Load saved addresses and validate coupon
  useEffect(() => {
    if (user) {
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            setSelectedAddressId(data[0].id);
            setFormData({
              fullName: data[0].full_name,
              phone: data[0].phone,
              addressLine1: data[0].address_line_1,
              addressLine2: data[0].address_line_2 || '',
              city: data[0].city,
              district: data[0].district || 'Malappuram',
              state: data[0].state || 'Kerala',
              pincode: data[0].pincode,
              landmark: data[0].landmark || '',
            });
          }
        });
    }

    if (couponCode && cartTotal > 0) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderTotal: cartTotal }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid && data.coupon) {
            setCouponDiscount(data.coupon.discount_amount);
          }
        })
        .catch(() => {});
    }
  }, [user, supabase, couponCode, cartTotal]);

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setFormData({
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line_1,
      addressLine2: addr.address_line_2 || '',
      city: addr.city,
      district: addr.district || 'Malappuram',
      state: addr.state || 'Kerala',
      pincode: addr.pincode,
      landmark: addr.landmark || '',
    });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.pincode) {
      setErrorMsg('Please fill in all mandatory address fields');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  // Place Order Action (Razorpay or COD)
  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const formattedAddress = {
      full_name: formData.fullName,
      phone: formData.phone,
      address_line_1: formData.addressLine1,
      address_line_2: formData.addressLine2,
      city: formData.city,
      district: formData.district,
      state: formData.state,
      pincode: formData.pincode,
      landmark: formData.landmark,
    };

    const orderPayload = {
      amount: grandTotal,
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerEmail: user.email,
      shippingAddress: formattedAddress,
      items: items.map((i) => ({
        productId: i.product_id,
        name: i.product?.name || 'Tool',
        productCode: i.product?.product_code || 'TM',
        imageUrl: i.product?.primary_image_url || '',
        quantity: i.quantity,
        unitPrice: i.product?.selling_price || 0,
      })),
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      discountAmount: couponDiscount,
      shippingAmount: shippingFee,
    };

    if (paymentMethod === 'cod') {
      try {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            customer_name: formData.fullName,
            customer_phone: formData.phone,
            customer_email: user.email,
            shipping_address: formattedAddress,
            subtotal: cartTotal,
            discount_amount: couponDiscount,
            shipping_amount: shippingFee,
            total_amount: grandTotal,
            coupon_code: couponDiscount > 0 ? couponCode : null,
            payment_method: 'cod',
            payment_status: 'pending',
            order_status: 'confirmed',
          })
          .select()
          .single();

        if (orderError || !order) throw new Error(orderError?.message || 'Failed to place COD order');

        const orderItemsToInsert = items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.product?.name || 'Tool',
          product_code: i.product?.product_code || 'TM',
          image_url: i.product?.primary_image_url || null,
          quantity: i.quantity,
          unit_price: i.product?.selling_price || 0,
          total_price: (i.product?.selling_price || 0) * i.quantity,
        }));
        await supabase.from('order_items').insert(orderItemsToInsert);

        await clearCart();
        router.push(`/checkout/success?orderNumber=${order.order_number}`);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Failed to process COD order');
        setLoading(false);
      }
      return;
    }

    // Razorpay Flow
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initiate Razorpay checkout');
      }

      const { orderId, orderNumber, razorpayOrderId, amount, keyId } = data;

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'TOOLSMAN',
        description: `Order #${orderNumber}`,
        image: '/logo.png',
        order_id: razorpayOrderId.startsWith('test_') ? undefined : razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: user.email,
          contact: formData.phone,
        },
        theme: {
          color: '#f97316',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderId,
                razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'test_signature',
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              await clearCart();
              router.push(`/checkout/success?orderNumber=${orderNumber}`);
            } else {
              setErrorMsg('Payment verification failed. Please check order status in your account.');
              setLoading(false);
            }
          } catch {
            setErrorMsg('Payment verification error.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert('Razorpay gateway simulated in dev mode.');
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature',
          }),
        });
        if (verifyRes.ok) {
          await clearCart();
          router.push(`/checkout/success?orderNumber=${orderNumber}`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  if (cartLoading || authLoading) {
    return (
      <div className="container-site py-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-neutral-600">Preparing checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">No items to checkout</h2>
        <button onClick={() => router.push('/shop')} className="btn-primary mt-4">
          Browse Tools
        </button>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-neutral-50/50 min-h-screen py-8 sm:py-12 border-b border-neutral-200">
        <div className="container-site max-w-5xl">
          {/* Top Progress Bar matching Reference Design */}
          <div className="flex items-center justify-center gap-4 sm:gap-12 mb-8 sm:mb-12">
            {[
              { num: 1, label: 'Address' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Place Order' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                    step >= s.num
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {s.num}
                </div>
                <span
                  className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${
                    step >= s.num ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Step Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
              {step === 1 && (
                <div>
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-orange-600 w-5 h-5" />
                      <h2 className="font-black text-lg text-neutral-900 uppercase tracking-tight">
                        1. Delivery Address
                      </h2>
                    </div>
                  </div>

                  {/* Saved addresses selector */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                        Choose Saved Address:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-orange-500 bg-orange-50/50 font-medium text-neutral-900'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="font-bold text-neutral-950">{addr.full_name} ({addr.phone})</div>
                            <div className="text-neutral-600 mt-0.5">
                              {addr.address_line_1}, {addr.city}, {addr.district}, {addr.pincode}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address form */}
                  <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="e.g. Firoz P"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="+91 79944 10167"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="House No., Building Name, Street"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="Tirur"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        District (Kerala) *
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 bg-white"
                      >
                        {keralaDistricts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="676552"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                        placeholder="Near Puthanathani Junction"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-4">
                      <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                        Continue to Payment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="text-orange-600 w-5 h-5" />
                      <h2 className="font-black text-lg text-neutral-900 uppercase tracking-tight">
                        2. Select Payment Method
                      </h2>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline"
                    >
                      <ArrowLeft size={13} />
                      Edit Address
                    </button>
                  </div>

                  {/* Address Summary */}
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs mb-6">
                    <div className="flex justify-between font-bold text-neutral-900 mb-1">
                      <span>Delivering to: {formData.fullName} ({formData.phone})</span>
                    </div>
                    <p className="text-neutral-600">
                      {formData.addressLine1}, {formData.city}, {formData.district}, Kerala - {formData.pincode}
                    </p>
                  </div>

                  {/* Payment Options Radio */}
                  <div className="flex flex-col gap-3 mb-6">
                    {/* Razorpay Online */}
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mt-1 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-neutral-950">
                            Online Payment (Razorpay)
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Fast & Instant
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          UPI (GPay, PhonePe, Paytm), Credit / Debit Card, Net Banking & Wallets
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {['UPI', 'Visa', 'Mastercard', 'RuPay', 'NetBanking'].map((m) => (
                            <span key={m} className="text-[10px] px-2 py-0.5 rounded bg-white border border-neutral-200 font-bold text-neutral-700">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-neutral-950">
                            Cash on Delivery (COD)
                          </span>
                          <Truck size={16} className="text-neutral-500" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Pay in cash or UPI directly to the delivery executive upon arrival.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* CTA Place Order */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>PAY SECURELY {formatCurrency(grandTotal)}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Order Summary Sidebar (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col gap-4 sticky top-24">
              <h3 className="font-black text-base text-neutral-950 uppercase tracking-tight pb-3 border-b border-neutral-100">
                Order Items ({items.length})
              </h3>

              {/* Items preview list */}
              <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.id} className="py-2.5 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded bg-neutral-50 shrink-0 border border-neutral-100">
                      {i.product?.primary_image_url && (
                        <Image
                          src={i.product.primary_image_url}
                          alt={i.product.name}
                          fill
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-neutral-900 truncate">
                        {i.product?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Qty: {i.quantity} × {formatCurrency(i.product?.selling_price || 0)}
                      </div>
                    </div>
                    <div className="font-bold text-xs text-neutral-950">
                      {formatCurrency((i.product?.selling_price || 0) * i.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-900">{formatCurrency(cartTotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  {shippingFee === 0 ? (
                    <span className="font-bold text-emerald-600 uppercase">FREE</span>
                  ) : (
                    <span className="font-bold text-neutral-900">{formatCurrency(shippingFee)}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="font-black text-sm text-neutral-950">Total Payable</span>
                <span className="font-black text-xl text-neutral-950">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-site py-16 text-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" /><p className="text-sm font-semibold text-neutral-600">Preparing checkout...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
