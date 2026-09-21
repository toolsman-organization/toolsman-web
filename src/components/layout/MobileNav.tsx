'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Home, ShoppingBag, Heart, User, LogOut, ChevronRight, Phone, Grid3X3, Truck, Package } from 'lucide-react';
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
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.refresh();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 touch-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
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
            className="text-gray-400 hover:text-white p-1 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {[
            { href: '/', label: 'Home', icon: <Home size={18} /> },
            { href: '/shop', label: 'Shop All', icon: <ShoppingBag size={18} /> },
            { href: '/track-order', label: 'Track Order', icon: <Truck size={18} /> },
            { href: user ? '/account/orders' : '/login?redirect=/account/orders', label: 'My Orders', icon: <Package size={18} /> },
            { href: '/account/wishlist', label: `Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`, icon: <Heart size={18} /> },
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
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
