'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, ChevronRight, Truck, Loader2 } from 'lucide-react';
import type { Category, ProductWithDetails } from '@/types/database';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
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

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<ProductWithDetails[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = desktopSearchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q.trim())}&limit=4`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.products ?? []);
        setShowSuggestions(true);
      }
    } catch {
      // silent fail
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleSuggestionClick = () => {
    setShowSuggestions(false);
    setSearchQuery('');
    setShowSearch(false);
  };

  // Reusable suggestions dropdown UI
  const SuggestionsDropdown = () => {
    if (!showSuggestions || !searchQuery.trim()) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
        {suggestionsLoading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-neutral-500">
            <Loader2 size={15} className="animate-spin" />
            <span className="text-xs font-medium">Searching...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs font-semibold text-neutral-500">No products found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {suggestions.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                onClick={handleSuggestionClick}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 transition-colors group"
              >
                <div className="relative w-11 h-11 shrink-0 rounded-md overflow-hidden border border-neutral-200 bg-neutral-50">
                  {product.primary_image_url ? (
                    <Image
                      src={product.primary_image_url}
                      alt={product.name}
                      fill
                      sizes="44px"
                      className="object-contain p-0.5"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 text-[10px] font-bold">IMG</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{product.name}</p>
                  <p className="text-[11px] text-neutral-400 font-medium">{product.brand_name || 'TOOLSMAN'}</p>
                </div>
                <span className="text-xs font-black text-orange-600 shrink-0">{formatCurrency(product.selling_price)}</span>
              </Link>
            ))}
            <Link
              href={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
              onClick={handleSuggestionClick}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Search size={12} />
              <span>View all results for &ldquo;{searchQuery}&rdquo;</span>
            </Link>
          </div>
        )}
      </div>
    );
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
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group" aria-label="TOOLSMAN Home">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="TOOLSMAN Logo"
                width={56}
                height={56}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-white font-black text-2xl tracking-wider uppercase leading-none select-none">
              TOOLSMAN
            </span>
          </Link>

          {/* Desktop Search Bar with Suggestions */}
          <div ref={desktopSearchRef} className="flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-6 relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search for drills, grinders, accessories..."
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  className="w-full pl-4 pr-14 py-2.5 rounded-sm text-sm bg-white text-gray-900 border-0 outline-none placeholder:text-gray-400"
                  aria-label="Search products"
                  autoComplete="off"
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
            <SuggestionsDropdown />
          </div>

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
            <nav className="relative flex items-center justify-center w-full py-0.5" aria-label="Main navigation">

              {/* Centered Group: All Categories + Dynamic Main Categories + Brands */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2">
                {/* Classic Simple Categories Dropdown */}
                <div className="relative group/allcat shrink-0">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/10 rounded-md transition-colors whitespace-nowrap"
                    aria-haspopup="true"
                  >
                    <Menu size={15} />
                    <span>All Categories</span>
                    <ChevronDown size={13} className="group-hover/allcat:rotate-180 transition-transform duration-200 ml-0.5" />
                  </button>

                  {/* Main Dropdown Menu */}
                  <div className="absolute top-full left-0 w-60 bg-white shadow-xl rounded-b-lg opacity-0 invisible group-hover/allcat:opacity-100 group-hover/allcat:visible transition-all duration-150 z-50 border-t-2 border-orange-500 text-left py-1 divide-y divide-gray-50 border border-gray-100">
                    {categories
                      .filter((cat) => !cat.parent_id)
                      .map((mainCat) => {
                        const subs = categories.filter((c) => c.parent_id === mainCat.id);
                        return (
                          <div key={mainCat.id} className="relative group/item">
                            <Link
                              href={`/category/${mainCat.slug}`}
                              className="flex items-center justify-between px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <span>{mainCat.name}</span>
                              {subs.length > 0 && (
                                <ChevronRight size={14} className="text-gray-400 group-hover/item:text-orange-600 group-hover/item:translate-x-0.5 transition-all" />
                              )}
                            </Link>

                            {/* Flyout Submenu for Subcategories */}
                            {subs.length > 0 && (
                              <div className="absolute top-0 left-full w-56 bg-white shadow-xl rounded-r-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-150 border border-gray-100 text-left py-1">
                                <div className="px-4 py-2 bg-orange-50/50 border-b border-orange-100/50 text-[11px] font-black text-orange-600 uppercase tracking-wider">
                                  {mainCat.name}
                                </div>
                                {subs.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/category/${sub.slug}`}
                                    className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Shop All link */}
                <Link
                  href="/shop"
                  className="px-3.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors whitespace-nowrap"
                >
                  Shop
                </Link>

                {/* Dynamic Main Categories nav links (simple links, no dropdown) */}
                {categories
                  .filter((cat) => !cat.parent_id)
                  .slice(0, 4)
                  .map((mainCat) => (
                    <Link
                      key={mainCat.id}
                      href={`/category/${mainCat.slug}`}
                      className="px-3.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      {mainCat.name}
                    </Link>
                  ))}

                {/* Brands link */}
                <Link
                  href="/shop"
                  className="px-3.5 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors whitespace-nowrap"
                >
                  Brands
                </Link>
              </div>

              {/* Right: Track Order link */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 shrink-0">
                <Link
                  href="/track-order"
                  className="px-3.5 py-2 text-sm font-semibold text-orange-400 hover:text-white hover:bg-orange-600/30 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <Truck size={15} />
                  <span>Track Order</span>
                </Link>
              </div>

            </nav>
          </div>
        </div>

        {/* Mobile Header Row */}
        <div className="flex md:hidden items-center justify-between gap-2 px-3.5 py-2.5">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0" aria-label="TOOLSMAN Home">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="TOOLSMAN" width={36} height={36} className="w-full h-full object-contain" priority />
            </div>
            <span className="text-white font-black text-lg tracking-wider uppercase leading-none">
              TOOLSMAN
            </span>
          </Link>

          {/* Right: Action Icons (Search, Cart & Menu Drawer Toggle) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search Toggle Button */}
            <button
              onClick={() => { setShowSearch(!showSearch); if (showSearch) { setShowSuggestions(false); setSearchQuery(''); } }}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                showSearch ? 'bg-orange-500 text-white' : 'text-white hover:bg-white/10 active:bg-white/15'
              }`}
              aria-label="Toggle search"
            >
              {showSearch ? <X size={19} /> : <Search size={19} />}
            </button>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="w-9 h-9 flex items-center justify-center text-white rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors relative"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span
                  className="absolute top-1 right-1 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-black leading-none shadow-xs"
                  style={{ backgroundColor: '#f97316', fontSize: '9px' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="w-9 h-9 flex items-center justify-center text-white rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {showSearch && (
          <div className="md:hidden px-3.5 pb-3 pt-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div ref={mobileSearchRef} className="relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search drills, grinders, accessories..."
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  className="w-full pl-3.5 pr-20 py-2 rounded-lg text-sm bg-white text-gray-900 outline-none border border-neutral-300 focus:border-orange-500 placeholder:text-gray-400 shadow-inner"
                  autoFocus
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
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
              <SuggestionsDropdown />
            </div>
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
