'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CartItemWithProduct, ProductWithDetails } from '@/types/database';
import type { User } from '@supabase/supabase-js';

const GUEST_CART_KEY = 'toolsman_guest_cart_v1';

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

function getGuestCart(): CartItemWithProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItemWithProduct[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest cart:', err);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);

  const supabase = createClient();

  // Fetch logged in user cart from Supabase
  const fetchUserCart = useCallback(async (userId: string, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:product_with_details!cart_items_product_id_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setItems(data as CartItemWithProduct[]);
      }
    } catch (err) {
      console.error('Error fetching user cart:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [supabase]);

  // Sync guest cart to user cart on login
  const syncGuestCartToUser = useCallback(async (userId: string) => {
    const guestItems = getGuestCart();
    if (guestItems.length > 0) {
      try {
        for (const gItem of guestItems) {
          await supabase.from('cart_items').upsert(
            { user_id: userId, product_id: gItem.product_id, quantity: gItem.quantity },
            { onConflict: 'user_id,product_id', ignoreDuplicates: false }
          );
        }
        localStorage.removeItem(GUEST_CART_KEY);
      } catch (err) {
        console.error('Error syncing guest cart to Supabase:', err);
      }
    }
  }, [supabase]);

  // Handle Auth State Changes & Initial Load
  useEffect(() => {
    let mounted = true;

    async function initCart() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!mounted) return;

      setUser(currentUser);
      userRef.current = currentUser;

      if (currentUser) {
        await syncGuestCartToUser(currentUser.id);
        await fetchUserCart(currentUser.id, true);
      } else {
        const guestItems = getGuestCart();
        setItems(guestItems);
        setLoading(false);
      }
    }

    initCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      userRef.current = currentUser;

      if (currentUser) {
        await syncGuestCartToUser(currentUser.id);
        await fetchUserCart(currentUser.id, false);
      } else {
        const guestItems = getGuestCart();
        setItems(guestItems);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserCart, syncGuestCartToUser]);

  // Add to cart with Optimistic UI updates
  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    const currentUser = userRef.current;

    if (currentUser) {
      // Optimistic update for logged in user
      setItems((prevItems) => {
        const existingIdx = prevItems.findIndex((i) => i.product_id === productId);
        if (existingIdx >= 0) {
          const updated = [...prevItems];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
          };
          return updated;
        }
        return prevItems;
      });

      // Background Supabase upsert
      try {
        const { data: currentItem } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', currentUser.id)
          .eq('product_id', productId)
          .maybeSingle();

        const newQty = (currentItem?.quantity || 0) + quantity;

        await supabase.from('cart_items').upsert(
          { user_id: currentUser.id, product_id: productId, quantity: newQty },
          { onConflict: 'user_id,product_id', ignoreDuplicates: false }
        );

        // Background sync to ensure full product details attached
        await fetchUserCart(currentUser.id, false);
      } catch (err) {
        console.error('Error adding to cart (Supabase):', err);
        await fetchUserCart(currentUser.id, false);
      }
    } else {
      // Guest user (localStorage)
      let productData: ProductWithDetails | null = null;
      try {
        const { data } = await supabase
          .from('product_with_details')
          .select('*')
          .eq('id', productId)
          .maybeSingle();
        if (data) {
          productData = data as ProductWithDetails;
        }
      } catch {
        // Continue with fallback
      }

      setItems((prevItems) => {
        const existingIdx = prevItems.findIndex((i) => i.product_id === productId);
        let updated: CartItemWithProduct[];

        if (existingIdx >= 0) {
          updated = [...prevItems];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
          };
        } else if (productData) {
          const newItem: CartItemWithProduct = {
            id: `guest_${productId}_${Date.now()}`,
            user_id: 'guest',
            product_id: productId,
            quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product: productData,
          };
          updated = [...prevItems, newItem];
        } else {
          updated = prevItems;
        }

        saveGuestCart(updated);
        return updated;
      });
    }
  }, [supabase, fetchUserCart]);

  // Update item quantity with instant Optimistic UI update
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const currentUser = userRef.current;

    // Instant optimistic local update with 0 lag and 0 page reload
    if (quantity <= 0) {
      setItems((prev) => {
        const updated = prev.filter((i) => i.product_id !== productId);
        if (!currentUser) saveGuestCart(updated);
        return updated;
      });
    } else {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        );
        if (!currentUser) saveGuestCart(updated);
        return updated;
      });
    }

    // Background persistence
    if (currentUser) {
      try {
        if (quantity <= 0) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', currentUser.id)
            .eq('product_id', productId);
        }
      } catch (err) {
        console.error('Error updating cart quantity:', err);
        await fetchUserCart(currentUser.id, false);
      }
    }
  }, [supabase, fetchUserCart]);

  // Remove item with instant Optimistic UI update
  const removeFromCart = useCallback(async (productId: string) => {
    const currentUser = userRef.current;

    // Instant optimistic update
    setItems((prev) => {
      const updated = prev.filter((i) => i.product_id !== productId);
      if (!currentUser) saveGuestCart(updated);
      return updated;
    });

    if (currentUser) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
      } catch (err) {
        console.error('Error removing from cart:', err);
        await fetchUserCart(currentUser.id, false);
      }
    }
  }, [supabase, fetchUserCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    const currentUser = userRef.current;
    setItems([]);
    saveGuestCart([]);

    if (currentUser) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', currentUser.id);
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    }
  }, [supabase]);

  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const cartTotal = items.reduce(
    (sum, item) => sum + (item.product?.selling_price ?? 0) * (item.quantity || 0),
    0
  );

  const refreshCart = useCallback(async () => {
    const currentUser = userRef.current;
    if (currentUser) {
      await fetchUserCart(currentUser.id, false);
    } else {
      setItems(getGuestCart());
    }
  }, [fetchUserCart]);

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

