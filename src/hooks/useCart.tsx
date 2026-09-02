'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CartItemWithProduct } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface CartContextValue {
  items: CartItemWithProduct[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  const fetchCart = useCallback(async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:product_with_details!cart_items_product_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    setItems((data as CartItemWithProduct[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchCart(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchCart(currentUser.id);
      } else {
        setItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCart, supabase.auth]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!user) { window.location.href = '/login?redirect=/cart'; return; }
    const { error } = await supabase.from('cart_items').upsert(
      { user_id: user.id, product_id: productId, quantity },
      { onConflict: 'user_id,product_id', ignoreDuplicates: false }
    );
    if (!error) await fetchCart(user.id);
  }, [user, supabase, fetchCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
    await fetchCart(user.id);
  }, [user, supabase, fetchCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) { await removeFromCart(productId); return; }
    await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', productId);
    await fetchCart(user.id);
  }, [user, supabase, fetchCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  }, [user, supabase]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + (item.product?.selling_price ?? 0) * item.quantity,
    0
  );

  const refreshCart = useCallback(async () => {
    if (user) await fetchCart(user.id);
  }, [user, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
