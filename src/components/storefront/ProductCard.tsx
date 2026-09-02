'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Check, Loader2 } from 'lucide-react';
import type { ProductWithDetails } from '@/types/database';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency, calculateDiscount } from '@/lib/utils';

interface ProductCardProps {
  product: ProductWithDetails;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = calculateDiscount(product.original_price, product.selling_price);
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;

    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  return (
    <div className="product-card group flex flex-col justify-between h-full bg-white rounded-lg border border-neutral-200/80 hover:border-orange-500/60 shadow-sm hover:shadow-xl transition-all duration-300">
      <div>
        {/* Top Badges & Wishlist */}
        <div className="relative p-3 pb-0 flex items-center justify-between z-10">
          <div className="flex flex-col gap-1 items-start">
            {discount > 0 && (
              <span className="bg-red-600 text-white font-black text-[11px] px-2 py-0.5 rounded tracking-wide shadow-sm">
                {discount}% OFF
              </span>
            )}
            {product.is_new && (
              <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wide shadow-sm">
                NEW
              </span>
            )}
            {product.is_best_seller && !product.is_new && (
              <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-wide shadow-sm">
                TOP PICK
              </span>
            )}
          </div>

          <button
            onClick={handleToggleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isWishlisted
                ? 'bg-red-50 text-red-500 hover:bg-red-100 scale-110'
                : 'bg-white/90 text-neutral-400 hover:text-red-500 hover:bg-white border border-neutral-200'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Product Image */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block w-full aspect-square p-4 overflow-hidden group-hover:scale-105 transition-transform duration-300"
        >
          {product.primary_image_url ? (
            <Image
              src={product.primary_image_url}
              alt={product.primary_image_alt || product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 rounded-md text-neutral-400">
              <span className="text-3xl">🛠️</span>
              <span className="text-xs font-semibold mt-1">Toolsman</span>
            </div>
          )}
        </Link>

        {/* Product Details */}
        <div className="p-4 pt-1 flex flex-col gap-1.5">
          {/* Brand & Code */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-extrabold text-neutral-900 tracking-wider uppercase text-[11px]">
              {product.brand_name || 'TOOLSMAN'}
            </span>
            <span className="font-mono text-[10px] text-neutral-400 tracking-wider font-semibold">
              {product.product_code}
            </span>
          </div>

          {/* Product Title */}
          <Link
            href={`/product/${product.slug}`}
            className="font-bold text-neutral-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-orange-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Ratings & Stock */}
          <div className="flex items-center gap-2 text-xs mt-0.5">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[11px] border border-amber-200/60">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>4.8</span>
              <span className="text-neutral-400 font-normal">(24)</span>
            </div>
            {isOutOfStock ? (
              <span className="text-red-500 font-semibold text-[11px] ml-auto">Out of stock</span>
            ) : (
              <span className="text-emerald-700 font-semibold text-[11px] ml-auto flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                In Stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Cart Action Bottom */}
      <div className="p-4 pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 mt-2 bg-neutral-50/50 rounded-b-lg">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-neutral-950">
              {formatCurrency(product.selling_price)}
            </span>
            {product.original_price > product.selling_price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.original_price)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="text-[10px] font-bold text-emerald-600">
              Save {formatCurrency(product.original_price - product.selling_price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`h-9 px-3.5 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 shadow-sm ${
            added
              ? 'bg-emerald-600 text-white'
              : isOutOfStock
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-orange-500/20 hover:shadow-orange-500/40 hover:shadow-md'
          }`}
          aria-label={`Add ${product.name} to cart`}
        >
          {adding ? (
            <Loader2 size={15} className="animate-spin" />
          ) : added ? (
            <>
              <Check size={14} className="stroke-[3]" />
              <span className="hidden sm:inline">Added</span>
            </>
          ) : (
            <>
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
