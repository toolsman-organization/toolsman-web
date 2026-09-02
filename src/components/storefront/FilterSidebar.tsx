'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X, Check, RotateCcw } from 'lucide-react';
import type { Category, Brand } from '@/types/database';

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
}

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

  const clearAllFilters = () => {
    router.push(pathname);
    setMobileOpen(false);
  };

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-orange-600" />
          <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">Filters</h3>
        </div>
        {(currentCategory || currentBrand || currentInStock || currentMinPrice || currentMaxPrice) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider mb-3">
          Category
        </h4>
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilters('category', null)}
            className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-md transition-colors ${
              !currentCategory
                ? 'bg-orange-50 font-bold text-orange-700'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Categories</span>
            {!currentCategory && <Check size={14} />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilters('category', currentCategory === cat.slug ? null : cat.slug)}
              className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-md transition-colors ${
                currentCategory === cat.slug
                  ? 'bg-orange-50 font-bold text-orange-700'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {currentCategory === cat.slug && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider mb-3">
          Brand
        </h4>
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilters('brand', null)}
            className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-md transition-colors ${
              !currentBrand
                ? 'bg-orange-50 font-bold text-orange-700'
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
              className={`flex items-center justify-between text-left text-xs sm:text-sm py-1.5 px-2.5 rounded-md transition-colors ${
                currentBrand === b.slug
                  ? 'bg-orange-50 font-bold text-orange-700'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="truncate">{b.name}</span>
              {currentBrand === b.slug && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider mb-3">
          Price (₹)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentMinPrice}
            onBlur={(e) => updateFilters('minPrice', e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 focus:outline-none focus:border-orange-500"
          />
          <span className="text-neutral-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentMaxPrice}
            onBlur={(e) => updateFilters('maxPrice', e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-800">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => updateFilters('inStock', e.target.checked ? 'true' : null)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-neutral-300"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-neutral-300 rounded-lg text-sm font-bold text-neutral-800 shadow-sm"
        >
          <Filter size={16} className="text-orange-600" />
          <span>Filter & Sort Products</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm self-start sticky top-24">
        {filterContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-50">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200">
                <h3 className="font-black text-neutral-900 text-lg">Filters</h3>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-full text-neutral-500 hover:text-neutral-900"
                >
                  <X size={22} />
                </button>
              </div>
              {filterContent}
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2.5 px-4 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
