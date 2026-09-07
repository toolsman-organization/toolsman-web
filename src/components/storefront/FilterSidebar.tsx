'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X, Check, RotateCcw, ArrowUpDown } from 'lucide-react';
import type { Category, Brand } from '@/types/database';

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
}

const sortOptions = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'popular', label: 'Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

export default function FilterSidebar({ categories, brands }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);

  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  useEffect(() => {
    setMinPriceInput(currentMinPrice);
  }, [currentMinPrice]);

  useEffect(() => {
    setMaxPriceInput(currentMaxPrice);
  }, [currentMaxPrice]);

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPriceFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput && parseFloat(minPriceInput) >= 0) {
      params.set('minPrice', minPriceInput.trim());
    } else {
      params.delete('minPrice');
    }
    if (maxPriceInput && parseFloat(maxPriceInput) > 0) {
      params.set('maxPrice', maxPriceInput.trim());
    } else {
      params.delete('maxPrice');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push(pathname);
    setMobileOpen(false);
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentBrand || currentInStock || currentMinPrice || currentMaxPrice || (currentSort && currentSort !== 'newest')
  );

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);
  const activeBrandObj = brands.find((b) => b.slug === currentBrand);

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-orange-600" />
          <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {currentCategory && (
            <button
              onClick={() => updateFilters('category', null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full hover:bg-orange-200 transition-colors"
            >
              <span>{activeCategoryObj?.name || currentCategory}</span>
              <X size={11} />
            </button>
          )}
          {currentBrand && (
            <button
              onClick={() => updateFilters('brand', null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <span>{activeBrandObj?.name || currentBrand}</span>
              <X size={11} />
            </button>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <button
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('minPrice');
                params.delete('maxPrice');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full hover:bg-neutral-300 transition-colors"
            >
              <span>₹{currentMinPrice || '0'} - ₹{currentMaxPrice || 'Any'}</span>
              <X size={11} />
            </button>
          )}
          {currentInStock && (
            <button
              onClick={() => updateFilters('inStock', null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full hover:bg-emerald-200 transition-colors"
            >
              <span>In Stock</span>
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* Mobile-Only Sort By Option */}
      <div className="lg:hidden">
        <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <ArrowUpDown size={13} className="text-orange-600" />
          <span>Sort By</span>
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilters('sort', opt.value === 'newest' ? null : opt.value)}
              className={`text-left text-xs py-2 px-2.5 rounded-lg border transition-colors ${
                currentSort === opt.value
                  ? 'bg-orange-500 border-orange-500 text-white font-black'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hierarchical Categories Filter */}
      <div>
        <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider mb-2.5">
          Category
        </h4>
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilters('category', null)}
            className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
              !currentCategory
                ? 'bg-orange-50 font-black text-orange-600'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Categories</span>
            {!currentCategory && <Check size={14} />}
          </button>

          {categories
            .filter((cat) => !cat.parent_id)
            .map((mainCat) => {
              const subs = categories.filter((c) => c.parent_id === mainCat.id);
              const isMainActive = currentCategory === mainCat.slug;
              const hasActiveSub = subs.some((s) => s.slug === currentCategory);

              return (
                <div key={mainCat.id} className="flex flex-col">
                  {/* Main Category Row */}
                  <button
                    onClick={() => updateFilters('category', isMainActive ? null : mainCat.slug)}
                    className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
                      isMainActive
                        ? 'bg-orange-50 font-black text-orange-600'
                        : hasActiveSub
                        ? 'font-bold text-neutral-900 hover:bg-neutral-100'
                        : 'font-semibold text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="truncate">{mainCat.name}</span>
                    {isMainActive && <Check size={14} className="text-orange-600" />}
                  </button>

                  {/* Subcategories (Indented) */}
                  {subs.length > 0 && (
                    <div className="pl-3.5 my-0.5 space-y-0.5 border-l-2 border-neutral-200 ml-2.5">
                      {subs.map((sub) => {
                        const isSubActive = currentCategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => updateFilters('category', isSubActive ? null : sub.slug)}
                            className={`w-full flex items-center justify-between text-left text-[11px] sm:text-xs py-1 px-2 rounded-md transition-colors ${
                              isSubActive
                                ? 'bg-orange-500 text-white font-bold shadow-2xs'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            {isSubActive && <Check size={12} className="text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider mb-2.5">
          Brand
        </h4>
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilters('brand', null)}
            className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
              !currentBrand
                ? 'bg-orange-50 font-black text-orange-600'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Brands</span>
            {!currentBrand && <Check size={14} />}
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => updateFilters('brand', currentBrand === b.slug ? null : b.slug)}
              className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
                currentBrand === b.slug
                  ? 'bg-orange-50 font-black text-orange-600'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="truncate">{b.name}</span>
              {currentBrand === b.slug && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range with Enter Key and Apply Button */}
      <div>
        <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider mb-2.5">
          Price Range (₹)
        </h4>
        <form onSubmit={applyPriceFilter} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
            <span className="text-neutral-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            Apply Price
          </button>
        </form>
      </div>

      {/* Stock Availability */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-neutral-800 hover:text-orange-600 transition-colors">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => updateFilters('inStock', e.target.checked ? 'true' : null)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-neutral-300 cursor-pointer accent-orange-600"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden w-full mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-between py-2.5 px-4 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-black text-neutral-900 shadow-2xs hover:border-orange-500 active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-orange-600" />
            <span>Filter & Sort Products</span>
          </div>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs self-start sticky top-24">
        {filterContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-50 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-orange-600" />
                  <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">Filters</h3>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>
              {filterContent}
            </div>

            <div className="pt-4 mt-6 border-t border-neutral-200 flex gap-2.5">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2.5 px-3 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  applyPriceFilter();
                  setMobileOpen(false);
                }}
                className="flex-1 py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/25"
              >
                Apply & View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

