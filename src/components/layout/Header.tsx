'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, Phone } from 'lucide-react';
import type { Category } from '@/types/database';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import MobileNav from './MobileNav';

interface HeaderProps {
  categories: Category[];
  storePhone?: string;
}

export default function Header({ categories, storePhone }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? 'shadow-lg' : ''}`}
        style={{ backgroundColor: '#111111' }}
      >
        {/* Desktop Header */}
        <div className="container-site hidden md:flex items-center gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="TOOLSMAN Home">
            <Image
              src="/logo.png"
              alt="TOOLSMAN Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
            <div className="hidden lg:block">
              <div className="text-white font-bold text-lg leading-none tracking-wide">TOOLSMAN</div>
              <div className="text-xs mt-0.5" style={{ color: '#f97316', fontSize: '10px' }}>
                SALES • SERVICE • RENT
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search for drills, grinders, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-sm text-sm bg-white text-gray-900 border-0 outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 rounded-r-sm flex items-center justify-center"
                style={{ backgroundColor: '#f97316' }}
                aria-label="Search"
              >
                <Search size={18} className="text-white" />
              </button>
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Phone */}
            {storePhone && (
              <a
                href={`tel:${storePhone}`}
                className="hidden xl:flex items-center gap-1.5 text-white text-xs px-3 py-2 hover:text-orange-400 transition-colors"
              >
                <Phone size={14} />
                <span>{storePhone}</span>
              </a>
            )}

            {/* Account */}
            <Link
              href={user ? '/account' : '/login'}
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 hover:text-orange-400 transition-colors"
              aria-label="Account"
            >
              <User size={20} />
              <span className="text-xs">Account</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 hover:text-orange-400 transition-colors relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart size={20} />
              <span className="text-xs">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 text-xs bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold" style={{ fontSize: '9px' }}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 hover:text-orange-400 transition-colors relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart size={20} />
              <span className="text-xs">Cart</span>
              {cartCount > 0 && (
                <span
                  className="absolute top-1 right-1 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Navigation Bar (Desktop) */}
        <div style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #2d2d2d' }} className="hidden md:block">
          <div className="container-site">
            <nav className="flex items-center gap-0" aria-label="Main navigation">
              {/* All Categories Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
                  aria-haspopup="true"
                >
                  <Menu size={16} />
                  All Categories
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                {/* Mega dropdown */}
                <div className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${cat.slug}`}
                      className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick nav links */}
              {['Power Tools', 'Hand Tools', 'Accessories'].map((label) => (
                <Link
                  key={label}
                  href={`/shop?search=${encodeURIComponent(label)}`}
                  className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/shop"
                className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Brands
              </Link>
              <Link
                href="/shop?sort=price-low"
                className="px-4 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
                style={{ color: '#f97316' }}
              >
                Offers
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="text-white p-1"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2 flex-1" aria-label="TOOLSMAN Home">
            <Image
              src="/logo.png"
              alt="TOOLSMAN"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="text-white font-bold text-base tracking-wide">TOOLSMAN</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-white p-1"
              aria-label="Toggle search"
            >
              <Search size={20} />
            </button>
            <Link
              href="/cart"
              className="text-white p-1 relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                ref={searchRef}
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-sm text-sm bg-white text-gray-900 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3 rounded-r-sm"
                style={{ backgroundColor: '#f97316' }}
              >
                <Search size={16} className="text-white" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={categories}
        user={user}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
      />
    </>
  );
}
