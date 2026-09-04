'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
import type { Category } from '@/types/database';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import MobileNav from './MobileNav';

interface HeaderProps {
  categories: Category[];
  storePhone?: string;
}

export default function Header({ categories }: HeaderProps) {
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
      {/* ================================================================
          Main Header — sticky, dark, contains logo + search + icons
          ================================================================ */}
      <header
        className={`sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? 'shadow-xl shadow-black/30' : ''}`}
        style={{ backgroundColor: '#111111' }}
      >
        {/* Desktop Header Row */}
        <div className="container-site hidden md:flex items-center justify-between gap-5 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="TOOLSMAN Home">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 shrink-0">
              <Image
                src="/logo.png"
                alt="TOOLSMAN Logo"
                width={34}
                height={34}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden lg:flex flex-col leading-none">
              <span className="text-white font-black text-[17px] tracking-widest uppercase">TOOLSMAN</span>
              <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#f97316' }}>
                SALES • SERVICE • RENT
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-6">
            <div className="relative">
              <input
                type="search"
                placeholder="Search for drills, grinders, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-14 py-2.5 rounded-sm text-sm bg-white text-gray-900 border-0 outline-none placeholder:text-gray-400"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 rounded-r-sm flex items-center justify-center transition-colors hover:brightness-110"
                style={{ backgroundColor: '#f97316' }}
                aria-label="Search"
              >
                <Search size={18} className="text-white" />
              </button>
            </div>
          </form>

          {/* Right Icons — account + wishlist + cart */}
          <div className="flex items-center shrink-0">

            {/* Account */}
            <Link
              href={user ? '/account' : '/login'}
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 rounded hover:text-orange-400 hover:bg-white/5 transition-colors"
              aria-label="Account"
            >
              <User size={20} />
              <span className="text-[10px] font-medium">Account</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 rounded hover:text-orange-400 hover:bg-white/5 transition-colors relative"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Heart size={20} />
              <span className="text-[10px] font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 text-white rounded-full w-4 h-4 flex items-center justify-center font-black leading-none"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center gap-0.5 text-white px-3 py-2 rounded hover:text-orange-400 hover:bg-white/5 transition-colors relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart size={20} />
              <span className="text-[10px] font-medium">Cart</span>
              {cartCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 text-white rounded-full w-4 h-4 flex items-center justify-center font-black leading-none"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #2d2d2d' }} className="hidden md:block">
          <div className="container-site">
            <nav className="flex items-center justify-center gap-1 sm:gap-2" aria-label="Main navigation">

              {/* All Categories Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 rounded transition-colors whitespace-nowrap"
                  aria-haspopup="true"
                >
                  <Menu size={15} />
                  All Categories
                  <ChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200 ml-0.5" />
                </button>
                {/* Mega dropdown */}
                <div className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border-t-2 border-orange-500 text-left">
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
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/shop"
                className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                Brands
              </Link>

              <Link
                href="/shop?sort=price-low"
                className="px-4 py-2.5 text-sm font-semibold hover:bg-white/10 rounded transition-colors"
                style={{ color: '#f97316' }}
              >
                Offers
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Header Row */}
        <div className="flex md:hidden items-center justify-between gap-2 px-3.5 py-2.5">
          {/* Left: Menu Drawer Toggle */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          {/* Center: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0" aria-label="TOOLSMAN Home">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1 shrink-0 shadow-xs">
              <Image src="/logo.png" alt="TOOLSMAN" width={24} height={24} className="object-contain" priority />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-[15px] tracking-wider uppercase">TOOLSMAN</span>
              <span className="text-[7.5px] font-bold tracking-widest uppercase text-orange-500 mt-0.5">
                POWER TOOLS
              </span>
            </div>
          </Link>

          {/* Right: Search & Cart Action Icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Search Toggle Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                showSearch ? 'bg-orange-500 text-white' : 'text-white hover:bg-white/10 active:bg-white/15'
              }`}
              aria-label="Toggle search"
            >
              {showSearch ? <X size={19} /> : <Search size={19} />}
            </button>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="w-10 h-10 flex items-center justify-center text-white rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-black leading-none shadow-xs"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {showSearch && (
          <div className="md:hidden px-3.5 pb-3 pt-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                ref={searchRef}
                type="search"
                placeholder="Search drills, grinders, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3.5 pr-20 py-2 rounded-lg text-sm bg-white text-gray-900 outline-none border border-neutral-300 focus:border-orange-500 placeholder:text-gray-400 shadow-inner"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 rounded-md flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                aria-label="Submit search"
              >
                <Search size={14} />
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
