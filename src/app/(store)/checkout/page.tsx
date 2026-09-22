'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import { ShieldCheck, MapPin, CreditCard, Truck, Loader2, ArrowLeft, Scale, ShoppingBag, Package, User, ChevronDown, Check, Search } from 'lucide-react';
import Link from 'next/link';
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

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
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
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Ensure checkout page opens at the top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = indianStates.filter((st) =>
    st.toLowerCase().includes(stateSearch.trim().toLowerCase())
  );

  // Address Form State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: 'Kerala',
    pincode: '',
    landmark: '',
  });

  // Payment Option (Exclusive Razorpay Online Payment)
  const [paymentMethod] = useState<'razorpay'>('razorpay');

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
            setFormData((prev) => ({
              ...prev,
              fullName: data[0].full_name,
              phone: data[0].phone,
              addressLine1: data[0].address_line_1,
              addressLine2: data[0].address_line_2 || '',
              city: data[0].city,
              district: data[0].district || '',
              state: data[0].state || 'Kerala',
              pincode: data[0].pincode,
              landmark: data[0].landmark || '',
            }));
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
    setFormData((prev) => ({
      ...prev,
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line_1,
      addressLine2: addr.address_line_2 || '',
      city: addr.city,
      district: addr.district || '',
      state: addr.state || 'Kerala',
      pincode: addr.pincode,
      landmark: addr.landmark || '',
    }));
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fullName.trim() ||
      !formData.phone.trim() ||
      !formData.addressLine1.trim() ||
      !formData.city.trim() ||
      !formData.district.trim() ||
      !formData.state.trim() ||
      !formData.pincode.trim()
    ) {
      setErrorMsg('Please fill in all mandatory fields: Full Name, Phone, Address, City, District, State, and PIN Code');
      return;
    }
    if (formData.pincode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit PIN code');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  // Place Order Action (Server-side validated Razorpay)
  const handlePlaceOrder = async () => {
    setLoading(true);
    setErrorMsg('');

    const formattedAddress = {
      full_name: formData.fullName.trim(),
      phone: formData.phone.trim(),
      address_line_1: formData.addressLine1.trim(),
      address_line_2: formData.addressLine2?.trim() || undefined,
      city: formData.city.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      landmark: formData.landmark.trim() || undefined,
    };

    const orderPayload = {
      customerName: formData.fullName.trim(),
      customerPhone: formData.phone.trim(),
      customerEmail: formData.email.trim().toLowerCase() || undefined,
      shippingAddress: formattedAddress,
      items: items.map((i) => ({
        productId: i.product_id,
        imageUrl: i.product?.primary_image_url || '',
        quantity: i.quantity,
      })),
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      paymentMethod: 'razorpay',
    };

    // Razorpay Exclusive Online Payment Flow
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
        order_id: razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email || undefined,
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
              setIsPaymentSuccess(true);
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
            // Customer closed the checkout without paying
            setLoading(false);
          },
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rzp.on('payment.failed', function (resp: any) {
          const desc = resp?.error?.description || resp?.error?.reason || 'Payment failed';
          setErrorMsg(`Payment failed: ${desc}. You can retry placing the order.`);
          setLoading(false);
          // Inform backend of failure
          fetch('/api/razorpay/record-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              errorDescription: desc,
            }),
          }).catch(() => {});
        });
        rzp.open();
      } else {
        setErrorMsg('Payment gateway is currently loading or unavailable. Please refresh and try again.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to initiate online payment.');
      setLoading(false);
    }
  };

  if (isPaymentSuccess) {
    return (
      <div className="container-site py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-neutral-900">Payment Successful!</h2>
        <p className="text-xs text-neutral-500 mt-1">Preparing your order confirmation details...</p>
      </div>
    );
  }

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
                      Shipping Address (All India Delivery)
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
                  <form onSubmit={handleAddressSubmit} className="space-y-3.5">
                    {/* Guest Checkout Notice */}
                    {!user && (
                      <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-800">
                          <User size={15} className="text-orange-600 shrink-0" />
                          <span>Checking out as <strong>Guest</strong>. Have an account?</span>
                        </div>
                        <Link
                          href="/login?redirect=/checkout"
                          className="font-bold text-orange-600 hover:text-orange-700 hover:underline uppercase tracking-wider text-[11px]"
                        >
                          Log In →
                        </Link>
                      </div>
                    )}

                    {/* Saved Addresses Selector */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-2">
                          Select Saved Address:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                selectedAddressId === addr.id
                                  ? 'border-orange-500 bg-orange-50/50 font-medium'
                                  : 'border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <div className="font-bold text-neutral-900">{addr.full_name}</div>
                              <div className="text-neutral-500 truncate">{addr.address_line_1}</div>
                              <div className="text-neutral-500">{addr.city}, {addr.state} - {addr.pincode}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inner Label Form Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-visible">
                      {/* Full Name */}
                      <div className="rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          Full Name <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Rahul Nair"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          Phone Number <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Email Address (Optional) */}
                      <div className="sm:col-span-2 rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                            Email Address
                          </label>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Optional (For E-Receipt & Tracking)
                          </span>
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* House / Street / Building */}
                      <div className="sm:col-span-2 rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          Building / Street / House Name <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.addressLine1}
                          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                          placeholder="Flat / House No., Building Name, Street / Road"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Landmark (Optional) */}
                      <div className="sm:col-span-2 rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                            Area / Locality / Landmark
                          </label>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Optional
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.landmark}
                          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                          placeholder="Nearby Landmark (e.g. Near Bus Stand / Temple / School)"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Town / City */}
                      <div className="rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          Town / City <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Tirur / Kochi / Pune"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* District (User Input) */}
                      <div className="rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          District <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="e.g. Malappuram / Pune / Thane"
                          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 placeholder:font-normal"
                        />
                      </div>

                      {/* Custom Modern State Selection Dropdown (Mandatory) */}
                      <div ref={stateDropdownRef} className="relative col-span-full sm:col-span-1">
                        <div
                          onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                          className={`rounded-xl border bg-white px-3.5 pt-2 pb-1.5 cursor-pointer select-none transition-all ${
                            isStateDropdownOpen
                              ? 'border-orange-500 ring-2 ring-orange-500/15'
                              : 'border-neutral-300 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none cursor-pointer">
                              State <span className="text-orange-600">*</span>
                            </label>
                            <ChevronDown
                              size={14}
                              className={`text-neutral-400 transition-transform duration-200 ${
                                isStateDropdownOpen ? 'rotate-180 text-orange-600' : ''
                              }`}
                            />
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-neutral-900 truncate py-0.5">
                            {formData.state || <span className="text-neutral-400 font-normal">Select State</span>}
                          </div>
                        </div>

                        {/* Floating Dropdown Card */}
                        {isStateDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-neutral-200 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                            {/* Search Bar */}
                            <div className="relative mb-2 px-1">
                              <input
                                type="text"
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                                placeholder="Search state / UT..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-900 outline-none focus:ring-2 focus:ring-orange-500/20 placeholder:font-normal placeholder:text-neutral-400"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>

                            {/* States List */}
                            <div className="max-h-56 overflow-y-auto no-scrollbar scrollbar-thin scrollbar-thumb-neutral-200 space-y-0.5 pr-0.5">
                              {filteredStates.map((st) => {
                                const isSelected = formData.state === st;
                                return (
                                  <button
                                    type="button"
                                    key={st}
                                    onClick={() => {
                                      setFormData({ ...formData, state: st });
                                      setIsStateDropdownOpen(false);
                                      setStateSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                                      isSelected
                                        ? 'bg-orange-50 text-orange-600 font-bold'
                                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                                    }`}
                                  >
                                    <span>{st}</span>
                                    {isSelected && <Check size={14} className="text-orange-600" />}
                                  </button>
                                );
                              })}
                              {filteredStates.length === 0 && (
                                <div className="py-4 text-center text-xs text-neutral-400">
                                  No state found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PIN Code */}
                      <div className="col-span-full sm:col-span-1 rounded-xl border border-neutral-300 bg-white px-3.5 pt-2 pb-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 select-none">
                          PIN Code (6 Digits) <span className="text-orange-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="e.g. 676552"
                          className="w-full bg-transparent text-xs sm:text-sm font-bold font-mono text-neutral-900 outline-none placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider mt-4 shadow-md shadow-orange-500/15"
                    >
                      Deliver to This Address
                    </button>
                  </form>
                ) : (
                  <div className="text-xs text-neutral-700 space-y-1">
                    <div className="font-bold text-neutral-950 text-sm">{formData.fullName}</div>
                    <div className="text-neutral-600">{formData.addressLine1}</div>
                    {formData.landmark && <div className="text-neutral-500">Landmark: {formData.landmark}</div>}
                    <div className="text-neutral-600">{formData.city}, {formData.district}, {formData.state} - {formData.pincode}</div>
                    <div className="text-neutral-900 font-bold pt-1">
                      Phone: {formData.phone} {formData.email ? `• Email: ${formData.email}` : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Exclusive Razorpay Online Payment */}
              {step === 2 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-100">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight">
                      Online Payment (Razorpay)
                    </h2>
                  </div>

                  <div className="mb-6">
                    <div className="p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/40 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard size={18} className="text-orange-600" />
                          <span className="font-extrabold text-sm text-neutral-950">
                            Pay Online via Razorpay
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                          100% Secure
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Instant, encrypted payment gateway. Supports Google Pay, PhonePe, Paytm, UPI, Credit/Debit cards, and NetBanking.
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {['Google Pay', 'PhonePe', 'Paytm', 'UPI', 'Cards', 'NetBanking'].map((badge) => (
                          <span key={badge} className="px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-[10px] font-bold text-neutral-800 shadow-2xs">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
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
                        <span>Initiating Razorpay Payment...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>PAY SECURELY VIA RAZORPAY {formatCurrency(grandTotal)}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Order Summary Sidebar (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm flex flex-col gap-5 sticky top-24">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-orange-600" />
                  <h3 className="font-black text-sm text-neutral-950 uppercase tracking-wider">
                    Order Summary
                  </h3>
                </div>
                <span className="text-[11px] font-black bg-orange-100 text-orange-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Items preview list */}
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto no-scrollbar scrollbar-none pr-1 space-y-1">
                {items.map((i) => (
                  <div key={i.id} className="py-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-neutral-50 shrink-0 border border-neutral-200/80 overflow-hidden shadow-2xs">
                      {i.product?.primary_image_url ? (
                        <Image
                          src={i.product.primary_image_url}
                          alt={i.product.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Package size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-neutral-900 line-clamp-2 leading-snug">
                        {i.product?.name}
                      </h4>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-extrabold text-[10px] text-neutral-700">
                          Qty: {i.quantity}
                        </span>
                        <span>× {formatCurrency(i.product?.selling_price || 0)}</span>
                      </div>
                    </div>
                    <div className="font-black text-xs sm:text-sm text-neutral-950 shrink-0 text-right">
                      {formatCurrency((i.product?.selling_price || 0) * i.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-100 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold text-neutral-900">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scale size={13} className="text-neutral-400" />
                    <span>Total Weight</span>
                  </span>
                  <span className="font-bold font-mono text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                    {totalCartWeightKg} KG
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 bg-emerald-50/80 p-2 rounded-lg font-bold border border-emerald-200/60">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600 items-center">
                  <span className="font-medium">Delivery Charge</span>
                  <span className="font-bold text-neutral-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">FREE</span>
                    ) : (
                      formatCurrency(shippingFee)
                    )}
                  </span>
                </div>
              </div>

              {/* Total Payable Box */}
              <div className="bg-neutral-900 text-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-black text-[11px] uppercase tracking-wider block text-orange-400">
                      Total Payable
                    </span>
                    <span className="text-[10px] text-neutral-400">Inclusive of all taxes</span>
                  </div>
                  <span className="font-black text-xl text-white font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Trust Micro Footer */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Safe & Encrypted</span>
                </span>
                <span className="flex items-center gap-1">
                  <Truck size={13} className="text-orange-500" />
                  <span>Fast All-India Dispatch</span>
                </span>
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
