'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ArrowRight, ShieldCheck, ShoppingBag, Tag, Loader2, Scale } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { calculateTotalCartWeight, calculateDeliveryCharge } from '@/lib/delivery';
import { createClient } from '@/lib/supabase/client';

export default function CartPage() {
  const supabase = createClient();
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  // Weight-based calculation
  const totalCartWeightKg = calculateTotalCartWeight(items);
  const deliveryCalc = calculateDeliveryCharge(
    totalCartWeightKg,
    baseCharge,
    additionalCharge
  );
  const shippingFee = deliveryCalc.deliveryCharge;
  const grandTotal = Math.max(0, cartTotal - couponDiscount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCouponError(data.error || 'Invalid coupon code');
        setCouponDiscount(0);
        setAppliedCoupon(null);
      } else {
        setCouponDiscount(data.coupon.discount_amount);
        setAppliedCoupon(data.coupon.code);
        setCouponError('');
      }
    } catch {
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  if (loading) {
    return (
      <div className="container-site py-16 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-neutral-600">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-neutral-50/50 min-h-[70vh] flex items-center justify-center py-12">
        <div className="container-site max-w-md text-center bg-white p-8 sm:p-10 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
            <ShoppingBag size={36} />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mb-2">YOUR CART IS EMPTY</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mb-6">
            Explore our heavy-duty professional drills, grinders, and power tools.
          </p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm font-bold">
            <span>START SHOPPING</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 border-b border-neutral-200">
      <div className="container-site">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Review Items
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              YOUR CART ({cartCount})
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-neutral-200/80 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all hover:border-neutral-300"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-neutral-50 p-2 shrink-0 border border-neutral-100 flex items-center justify-center"
                  >
                    {product.primary_image_url ? (
                      <Image
                        src={product.primary_image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="120px"
                      />
                    ) : (
                      <span className="text-2xl">🛠️</span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between w-full">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                        <span className="font-extrabold text-neutral-900 uppercase tracking-wider">
                          {product.brand_name || 'TOOLSMAN'}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400 font-semibold">
                          {product.product_code}
                        </span>
                      </div>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-bold text-neutral-950 text-sm sm:text-base hover:text-orange-600 transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>

                      {product.weight && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1 font-medium">
                          <Scale size={13} className="text-neutral-400" />
                          <span>Weight: <strong className="text-neutral-700">{product.weight}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-lg text-neutral-950">
                          {formatCurrency(product.selling_price * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-neutral-400">
                            ({formatCurrency(product.selling_price)} each)
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, item.quantity - 1)}
                            className="p-2 text-neutral-600 hover:bg-neutral-200 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-xs font-black text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, item.quantity + 1)}
                            disabled={item.quantity >= product.stock_quantity}
                            className="p-2 text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromCart(product.id);
                          }}
                          className="text-neutral-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary & Checkout (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sticky top-24">
            {/* Coupon Box */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">
                <Tag size={15} className="text-orange-600" />
                <span>Apply Coupon</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <span>Coupon &quot;{appliedCoupon}&quot; Applied!</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveCoupon();
                    }}
                    className="text-red-600 hover:underline ml-2 font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs rounded-md border border-neutral-300 focus:outline-none focus:border-orange-500 uppercase font-mono font-bold"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'APPLY'}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-xs text-red-600 mt-2 font-medium">{couponError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
              <h2 className="font-black text-base text-neutral-950 uppercase tracking-wider pb-3 border-b border-neutral-100">
                Order Summary
              </h2>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-neutral-600">
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
                <span className="font-black text-base text-neutral-950">Total Amount</span>
                <span className="font-black text-2xl text-neutral-950">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Checkout CTA */}
              <Link
                href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon}` : ''}`}
                className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/25"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight size={16} />
              </Link>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 font-semibold pt-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Secure Checkout & Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
