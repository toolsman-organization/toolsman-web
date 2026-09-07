'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import { ShieldCheck, MapPin, CreditCard, Truck, Loader2, ArrowLeft, Scale } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { calculateTotalCartWeight, calculateDeliveryCharge } from '@/lib/delivery';
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

  // Delivery settings
  const [baseCharge, setBaseCharge] = useState(100);
  const [additionalCharge, setAdditionalCharge] = useState(50);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['delivery_base_charge', 'delivery_additional_kg_charge', 'shipping_charge'])
      .then(({ data }) => {
        if (data) {
          data.forEach((s) => {
            if (s.setting_key === 'delivery_base_charge' && s.setting_value) {
              setBaseCharge(parseFloat(s.setting_value) || 100);
            } else if (s.setting_key === 'delivery_additional_kg_charge' && s.setting_value) {
              setAdditionalCharge(parseFloat(s.setting_value) || 50);
            } else if (s.setting_key === 'shipping_charge' && s.setting_value && !baseCharge) {
              setBaseCharge(parseFloat(s.setting_value) || 100);
            }
          });
        }
      });
  }, [supabase, baseCharge]);

  // Dynamic weight-based delivery charge calculation
  const totalCartWeightKg = calculateTotalCartWeight(items);
  const deliveryCalc = calculateDeliveryCharge(
    totalCartWeightKg,
    baseCharge,
    additionalCharge
  );
  const shippingFee = deliveryCalc.deliveryCharge;
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

  // Place Order Action (Server-side validated Razorpay or COD)
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
      customerName: formData.fullName,
      customerPhone: formData.phone,
      customerEmail: user.email,
      shippingAddress: formattedAddress,
      items: items.map((i) => ({
        productId: i.product_id,
        imageUrl: i.product?.primary_image_url || '',
        quantity: i.quantity,
      })),
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      paymentMethod,
    };

    if (paymentMethod === 'cod') {
      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to place COD order');
        }

        await clearCart();
        router.push(`/checkout/success?orderNumber=${data.orderNumber}`);
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
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await clearCart();
              router.push(`/checkout/success?orderNumber=${orderNumber}`);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (verErr: unknown) {
            setErrorMsg((verErr as Error).message || 'Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback demo simulation if script failed to load
        setTimeout(async () => {
          await clearCart();
          router.push(`/checkout/success?orderNumber=${orderNumber}`);
        }, 1200);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to initiate online payment.');
      setLoading(false);
    }
  };

  if (cartLoading || authLoading) {
    return (
      <div className="container-site py-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-neutral-600">Loading checkout details...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-black text-neutral-900 mb-2">YOUR CART IS EMPTY</h2>
        <p className="text-xs text-neutral-500 mb-6">Add tools to your cart to proceed with checkout.</p>
        <button
          onClick={() => router.push('/shop')}
          className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-white min-h-screen py-6 sm:py-10 border-b border-neutral-200">
        <div className="container-site max-w-6xl">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
                Safe & Encrypted
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
                Secure Checkout
              </h1>
            </div>
            <button
              onClick={() => router.push('/cart')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Cart</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Steps (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Step 1: Shipping Address */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight">
                      Shipping Address (Kerala Only)
                    </h2>
                  </div>
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      Change Address
                    </button>
                  )}
                </div>

                {step === 1 ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    {/* Saved Addresses Selector */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                          Select Saved Address:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                selectedAddressId === addr.id
                                  ? 'border-orange-500 bg-orange-50/50 font-medium'
                                  : 'border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <div className="font-bold text-neutral-900">{addr.full_name}</div>
                              <div className="text-neutral-500 truncate">{addr.address_line_1}</div>
                              <div className="text-neutral-500">{addr.city}, {addr.pincode}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-medium focus:outline-none focus:border-orange-500"
                          placeholder="e.g. Rahul Nair"
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
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-medium focus:outline-none focus:border-orange-500"
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          Building / Street / House Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.addressLine1}
                          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-medium focus:outline-none focus:border-orange-500"
                          placeholder="Flat No., Building Name, Road"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          Area / Locality / Landmark
                        </label>
                        <input
                          type="text"
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-medium focus:outline-none focus:border-orange-500"
                          placeholder="Nearby Landmark (e.g. Near Bus Stand)"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-medium focus:outline-none focus:border-orange-500"
                          placeholder="e.g. Tirur"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          District *
                        </label>
                        <select
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 bg-white font-medium focus:outline-none focus:border-orange-500"
                        >
                          {keralaDistricts.map((dist) => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          disabled
                          value="Kerala"
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
                          placeholder="676552"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider mt-4"
                    >
                      Deliver to This Address
                    </button>
                  </form>
                ) : (
                  <div className="text-xs text-neutral-700 space-y-1">
                    <div className="font-bold text-neutral-950 text-sm">{formData.fullName}</div>
                    <div className="text-neutral-600">{formData.addressLine1}</div>
                    {formData.landmark && <div className="text-neutral-500">Landmark: {formData.landmark}</div>}
                    <div className="text-neutral-600">{formData.city}, {formData.district} - {formData.pincode}, Kerala</div>
                    <div className="text-neutral-900 font-bold pt-1">Phone: {formData.phone}</div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight">
                      Select Payment Mode
                    </h2>
                  </div>

                  <div className="space-y-3 mb-6">
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
                            Pay Online (UPI, Cards, NetBanking)
                          </span>
                          <CreditCard size={16} className="text-neutral-500" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Instant, 100% secure payment via Razorpay. Supports Google Pay, PhonePe, Paytm, all Credit/Debit cards.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {['UPI', 'GPay', 'PhonePe', 'Cards', 'NetBanking'].map((badge) => (
                            <span key={badge} className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-700">
                              {badge}
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

                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Scale size={13} className="text-neutral-400" />
                    <span>Total Weight</span>
                  </span>
                  <span className="font-bold font-mono text-neutral-800">
                    {totalCartWeightKg} KG
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-neutral-900">{formatCurrency(shippingFee)}</span>
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
