'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Zap, Heart, Minus, Plus, Check, Loader2, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import type { ProductFullDetail } from '@/types/database';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

interface ProductActionsProps {
  product: ProductFullDetail;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [added, setAdded] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || buyingNow) return;
    setBuyingNow(true);
    try {
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (err) {
      console.error(err);
      setBuyingNow(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Quantity Selector & Stock Indicator */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Quantity:
        </span>
        <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-xs">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isOutOfStock}
            className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>
          <span className="w-12 text-center font-bold text-sm text-neutral-900">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
            disabled={quantity >= product.stock_quantity || isOutOfStock}
            className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <span className="text-xs font-bold text-amber-600 animate-pulse">
            Only {product.stock_quantity} left in stock!
          </span>
        )}
      </div>

      {/* Buttons: Add to Cart, Buy Now, Wishlist */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`flex-1 min-w-0 h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm tracking-tight sm:tracking-normal flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 shadow-md ${
            added
              ? 'bg-emerald-600 text-white'
              : isOutOfStock
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-98'
          }`}
        >
          {adding ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : added ? (
            <>
              <Check size={16} className="stroke-[3] shrink-0" />
              <span className="truncate">Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={16} className="shrink-0" />
              <span className="truncate">ADD TO CART</span>
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock || buyingNow}
          className="flex-1 min-w-0 h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm tracking-tight sm:tracking-normal bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 shadow-lg shadow-orange-500/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buyingNow ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : (
            <>
              <Zap size={16} className="fill-current shrink-0" />
              <span className="truncate">BUY NOW</span>
            </>
          )}
        </button>

        <button
          onClick={() => toggleWishlist(product.id)}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 ${
            isWishlisted
              ? 'bg-red-50 text-red-500 border-red-200'
              : 'bg-white text-neutral-400 border-neutral-300 hover:text-red-500 hover:bg-neutral-50'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Delivery & Service Info Card */}
      <div className="mt-2 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-col gap-3 text-xs text-neutral-600">
        <div className="flex items-center gap-2.5">
          <Truck size={16} className="text-orange-600 shrink-0" />
          <span><strong>Fast Doorstep Delivery:</strong> Delivered in 2-4 business days across Kerala</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-orange-600 shrink-0" />
          <span><strong>100% Genuine Brand Warranty:</strong> Manufacturer backed guarantee</span>
        </div>
        <div className="flex items-center gap-2.5">
          <RefreshCw size={16} className="text-orange-600 shrink-0" />
          <span><strong>Service & Spares Support:</strong> Available at Toolsman Authorized Service Network</span>
        </div>
      </div>
    </div>
  );
}
