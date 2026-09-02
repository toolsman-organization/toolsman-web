'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);
  const supabase = createClient();

  const fetchWishlist = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId);
    const ids = new Set((data ?? []).map((w: { product_id: string }) => w.product_id));
    setWishlistIds(ids);
    setWishlistCount(ids.size);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchWishlist(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchWishlist(session.user.id);
      } else {
        setWishlistIds(new Set());
        setWishlistCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchWishlist, supabase.auth]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    if (wishlistIds.has(productId)) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
    }
    await fetchWishlist(user.id);
  }, [supabase, wishlistIds, fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { wishlistIds, wishlistCount, toggleWishlist, isInWishlist };
}
