'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Home, ShoppingBag, Heart, User, LogOut, ChevronRight, Phone, Grid3X3, Truck, Package, Loader2 } from 'lucide-react';
import type { Category } from '@/types/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  user: SupabaseUser | null;
  cartCount: number;
  wishlistCount: number;
}

export default function MobileNav({
  isOpen,
  onClose,
  categories,
  user,
  cartCount,
  wishlistCount,
}: MobileNavProps) {
  const router = useRouter();
  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleMain = (id: string) => {
    setExpandedMains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      setShowLogoutModal(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      setShowLogoutModal(false);
      onClose();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 touch-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => !showLogoutModal && onClose()}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col shadow-2xl transition-transform duration-300 overscroll-contain ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: '#111111' }}
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #2d2d2d' }}>
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="TOOLSMAN" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-lg tracking-wider">TOOLSMAN</span>
          </Link>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Profile Card (if logged in) */}
        {user ? (
          <div className="px-4 py-3 bg-white/5 border-b border-[#2d2d2d]">
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate group-hover:text-orange-400 transition-colors">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-white/5 border-b border-[#2d2d2d]">
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-between text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors py-1"
            >
              <div className="flex items-center gap-2">
                <User size={15} />
                <span>Sign In / Register</span>
              </div>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {[
            { href: '/', label: 'Home', icon: <Home size={18} /> },
            { href: '/shop', label: 'Shop All', icon: <ShoppingBag size={18} /> },
            { href: user ? '/account' : '/login?redirect=/account', label: 'My Account', icon: <User size={18} /> },
            { href: user ? '/account/orders' : '/login?redirect=/account/orders', label: 'My Orders', icon: <Package size={18} /> },
            { href: '/account/wishlist', label: `Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`, icon: <Heart size={18} /> },
            { href: '/track-order', label: 'Track Order', icon: <Truck size={18} /> },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              {item.icon && <span style={{ color: '#f97316' }}>{item.icon}</span>}
              {item.label}
            </Link>
          ))}

          {/* Hierarchical Categories Accordion */}
          <div className="px-4 py-2 mt-1" style={{ borderTop: '1px solid #2d2d2d' }}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f97316' }}>
              <Grid3X3 size={13} />
              Categories
            </div>

            <div className="space-y-1">
              {categories
                .filter((cat) => !cat.parent_id)
                .map((mainCat) => {
                  const subs = categories.filter((c) => c.parent_id === mainCat.id);
                  const isExpanded = expandedMains[mainCat.id] ?? false;

                  if (subs.length > 0) {
                    return (
                      <div key={mainCat.id} className="rounded-lg overflow-hidden">
                        <div
                          onClick={() => toggleMain(mainCat.id)}
                          className="flex items-center justify-between text-sm py-2 px-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-white font-bold select-none"
                        >
                          <span>{mainCat.name}</span>
                          <ChevronRight
                            size={16}
                            className={`transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-90 text-orange-500' : ''}`}
                          />
                        </div>

                        {/* Subcategories Accordion Content */}
                        {isExpanded && (
                          <div className="pl-3 pr-2 py-1.5 my-1 space-y-1 bg-white/5 rounded-lg border-l-2 border-orange-500">
                            <Link
                              href={`/shop?category=${mainCat.slug}`}
                              onClick={onClose}
                              className="block py-1.5 px-2 text-xs font-black text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-wider"
                            >
                              All {mainCat.name} →
                            </Link>
                            {subs.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/shop?category=${sub.slug}`}
                                onClick={onClose}
                                className="block py-1.5 px-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={mainCat.id}>
                      <Link
                        href={`/shop?category=${mainCat.slug}`}
                        onClick={onClose}
                        className="flex items-center justify-between text-sm py-2 px-2.5 rounded-lg hover:bg-white/5 transition-colors text-white font-bold"
                      >
                        <span>{mainCat.name}</span>
                      </Link>
                    </div>
                  );
                })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #2d2d2d' }}>
          <a
            href="tel:+917994410167"
            className="flex items-center gap-2 text-gray-400 text-sm mb-3 hover:text-white"
          >
            <Phone size={16} style={{ color: '#f97316' }} />
            +91 79944 10167
          </a>
          {user && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 text-sm text-neutral-300 hover:text-red-400 transition-colors w-full cursor-pointer py-1"
            >
              <LogOut size={16} className="text-red-400" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Sign Out Confirmation Modal (Mobile) */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-neutral-100 text-center text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut size={22} />
            </div>

            <h3 className="text-base font-black text-neutral-950 mb-1">
              Sign Out
            </h3>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              Are you sure you want to sign out of your Toolsman account?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <span>Sign Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
