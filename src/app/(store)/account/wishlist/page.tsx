import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/storefront/ProductCard';
import type { ProductWithDetails } from '@/types/database';

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/account/wishlist');

  const { data: wishlistData } = await supabase
    .from('wishlist')
    .select(`
      product_id,
      product:product_with_details!wishlist_product_id_fkey(*)
    `)
    .eq('user_id', user.id);

  const products = (wishlistData ?? [])
    .map((w) => w.product as unknown as ProductWithDetails)
    .filter(Boolean);

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 border-b border-neutral-200">
      <div className="container-site">
        <Link href="/account" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} />
          Back to Account
        </Link>

        <div className="flex items-center justify-between pb-4 mb-8 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Saved Tools
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
              MY WISHLIST ({products.length})
            </h1>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm max-w-md mx-auto">
            <Heart size={44} className="mx-auto text-neutral-300 mb-3" />
            <h2 className="text-lg font-bold text-neutral-800 mb-1">Your wishlist is empty</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              Save your favorite power tools and machinery to track price changes and availability.
            </p>
            <Link href="/shop" className="btn-primary text-xs">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
