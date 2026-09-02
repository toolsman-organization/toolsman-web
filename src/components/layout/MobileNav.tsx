'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Home, ShoppingBag, Heart, User, LogOut, ChevronRight, Phone, Grid3X3 } from 'lucide-react';
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

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#111111' }}
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #2d2d2d' }}>
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <Image src="/logo.png" alt="TOOLSMAN" width={36} height={36} className="object-contain" />
            <span className="text-white font-bold text-base">TOOLSMAN</span>
          </Link>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* User info */}
        {user ? (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #2d2d2d' }}>
            <Link href="/account" onClick={onClose} className="flex items-center gap-3 group">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: '#f97316', color: '#fff' }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{user.email?.split('@')[0]}</div>
                <div className="text-gray-400 text-xs">View Profile</div>
              </div>
              <ChevronRight size={16} className="text-gray-500 ml-auto group-hover:text-orange-400" />
            </Link>
          </div>
        ) : (
          <div className="px-4 py-3 flex gap-2" style={{ borderBottom: '1px solid #2d2d2d' }}>
            <Link href="/login" onClick={onClose} className="btn-primary flex-1 py-2 text-sm justify-center">
              Sign In
            </Link>
            <Link href="/register" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm justify-center">
              Register
            </Link>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {[
            { href: '/', label: 'Home', icon: <Home size={18} /> },
            { href: '/shop', label: 'Shop All', icon: <ShoppingBag size={18} /> },
            { href: '/account/wishlist', label: `Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`, icon: <Heart size={18} /> },
            { href: '/cart', label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}`, icon: null },
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

          {/* Categories */}
          <div className="px-4 py-2 mt-1" style={{ borderTop: '1px solid #2d2d2d' }}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f97316' }}>
              <Grid3X3 size={13} />
              Categories
            </div>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                onClick={onClose}
                className="block py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
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
