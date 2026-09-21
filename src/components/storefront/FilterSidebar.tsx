'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X, Check, Minus, RotateCcw, ArrowUpDown, ChevronRight } from 'lucide-react';
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

  // Accordion expanded state for main categories
  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMinPriceInput(currentMinPrice);
  }, [currentMinPrice]);

  useEffect(() => {
    setMaxPriceInput(currentMaxPrice);
  }, [currentMaxPrice]);

  // Main Categories and Subcategories tree
  const mainCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const subcategoriesMap = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const cat of categories) {
      if (cat.parent_id) {
        if (!map[cat.parent_id]) map[cat.parent_id] = [];
        map[cat.parent_id].push(cat);
      }
    }
    return map;
  }, [categories]);

  // Active category slugs array from URL
  const activeCategorySlugs = useMemo(() => {
    if (!currentCategory) return [];
    return currentCategory.split(',').map((s) => s.trim()).filter(Boolean);
  }, [currentCategory]);

  // Active brand slugs array from URL
  const activeBrandSlugs = useMemo(() => {
    if (!currentBrand) return [];
    return currentBrand.split(',').map((s) => s.trim()).filter(Boolean);
  }, [currentBrand]);

  const handleBrandToggle = (brandSlug: string) => {
    const isChecked = activeBrandSlugs.includes(brandSlug);
    updateFilters('brand', isChecked ? null : brandSlug);
  };

  // Auto expand Main Categories that have an active category or active subcategory
  useEffect(() => {
    setExpandedMains((prev) => {
      const next = { ...prev };
      let updated = false;

      mainCategories.forEach((main) => {
        const subs = subcategoriesMap[main.id] || [];
        const isMainActive = activeCategorySlugs.includes(main.slug);
        const hasActiveSub = subs.some((s) => activeCategorySlugs.includes(s.slug));

        if ((isMainActive || hasActiveSub) && !next[main.id]) {
          next[main.id] = true;
          updated = true;
        }
      });

      return updated ? next : prev;
    });
  }, [activeCategorySlugs, mainCategories, subcategoriesMap]);

  const toggleExpand = (mainId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMains((prev) => ({ ...prev, [mainId]: !prev[mainId] }));
  };

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

  const isSubcategoryChecked = (sub: Category) => {
    return activeCategorySlugs.includes(sub.slug);
  };

  const handleSubcategoryToggle = (sub: Category, main: Category) => {
    const subs = subcategoriesMap[main.id] || [];
    const subSlugs = subs.map((s) => s.slug);

    const isChecked = activeCategorySlugs.includes(sub.slug);

    // Remove main.slug and any other subcategory of this main category
    const cleanSlugs = activeCategorySlugs.filter(
      (slug) => slug !== main.slug && !subSlugs.includes(slug)
    );

    let nextSlugs: string[] = [];
    if (!isChecked) {
      // Select single subcategory
      nextSlugs = [...cleanSlugs, sub.slug];
    } else {
      // Uncheck it
      nextSlugs = cleanSlugs;
    }

    updateFilters('category', nextSlugs.length > 0 ? nextSlugs.join(',') : null);
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

  const activeBrandObj = brands.find((b) => b.slug === currentBrand);

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-700" />
          <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {activeCategorySlugs.map((slug) => {
            const catObj = categories.find((c) => c.slug === slug);
            return (
              <button
                key={slug}
                onClick={() => {
                  const updated = activeCategorySlugs.filter((s) => s !== slug);
                  updateFilters('category', updated.length > 0 ? updated.join(',') : null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <span>{catObj?.name || slug}</span>
                <X size={11} />
              </button>
            );
          })}
          {activeBrandSlugs.map((slug) => {
            const bObj = brands.find((b) => b.slug === slug);
            return (
              <button
                key={slug}
                onClick={() => handleBrandToggle(slug)}
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <span>{bObj?.name || slug}</span>
                <X size={11} />
              </button>
            );
          })}
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
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider">
            Category
          </h4>
          {activeCategorySlugs.length > 0 && (
            <button
              onClick={() => updateFilters('category', null)}
              className="text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar scrollbar-none pr-1">
          {mainCategories.map((mainCat) => {
            const subs = subcategoriesMap[mainCat.id] || [];
            const isExpanded = expandedMains[mainCat.id] ?? false;
            const isMainActive = activeCategorySlugs.includes(mainCat.slug);
            const hasSubActive = subs.some((s) => activeCategorySlugs.includes(s.slug));

            if (subs.length > 0) {
              return (
                <div key={mainCat.id} className="flex flex-col rounded-lg py-0.5">
                  {/* Main Category Row (No Checkbox) */}
                  <div
                    onClick={() => toggleExpand(mainCat.id)}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg select-none cursor-pointer hover:bg-neutral-100 group transition-colors"
                  >
                    <span
                      className={`text-xs sm:text-sm truncate transition-colors ${
                        isMainActive || hasSubActive
                          ? 'font-bold text-neutral-900'
                          : 'font-medium text-neutral-700 group-hover:text-neutral-900'
                      }`}
                    >
                      {mainCat.name}
                    </span>

                    <ChevronRight
                      size={15}
                      className={`transition-transform duration-200 text-neutral-400 group-hover:text-neutral-700 shrink-0 ml-1 ${
                        isExpanded ? 'rotate-90 text-neutral-900 font-bold' : ''
                      }`}
                    />
                  </div>

                  {/* Subcategories Indented List */}
                  {isExpanded && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-neutral-200 ml-3.5 my-0.5">
                      {subs.map((sub) => {
                        const isSubChecked = isSubcategoryChecked(sub);
                        return (
                          <label
                            key={sub.id}
                            className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-neutral-100 cursor-pointer select-none transition-colors group/sub"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSubcategoryToggle(sub, mainCat);
                            }}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSubChecked
                                  ? 'bg-neutral-900 border-neutral-900 text-white'
                                  : 'border-neutral-300 bg-white group-hover/sub:border-neutral-400'
                              }`}
                            >
                              {isSubChecked && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span
                              className={`text-xs truncate transition-colors ${
                                isSubChecked
                                  ? 'font-bold text-neutral-900'
                                  : 'font-normal text-neutral-600 group-hover/sub:text-neutral-900'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Category without subcategories
            const isChecked = activeCategorySlugs.includes(mainCat.slug);
            return (
              <div key={mainCat.id} className="flex flex-col rounded-lg py-0.5">
                <label
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 cursor-pointer select-none transition-colors group"
                  onClick={(e) => {
                    e.preventDefault();
                    let nextSlugs: string[] = [];
                    if (isChecked) {
                      nextSlugs = activeCategorySlugs.filter((s) => s !== mainCat.slug);
                    } else {
                      nextSlugs = [...activeCategorySlugs, mainCat.slug];
                    }
                    updateFilters('category', nextSlugs.length > 0 ? nextSlugs.join(',') : null);
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-xs sm:text-sm truncate transition-colors ${
                      isChecked
                        ? 'font-bold text-neutral-900'
                        : 'font-medium text-neutral-700 group-hover:text-neutral-900'
                    }`}
                  >
                    {mainCat.name}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase tracking-wider">
            Brand
          </h4>
          {activeBrandSlugs.length > 0 && (
            <button
              onClick={() => updateFilters('brand', null)}
              className="text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto no-scrollbar scrollbar-none pr-1">
          {brands.map((b) => {
            const isChecked = activeBrandSlugs.includes(b.slug);
            return (
              <label
                key={b.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleBrandToggle(b.slug);
                }}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-neutral-50 cursor-pointer select-none transition-colors group/brand"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'border-neutral-300 bg-white group-hover/brand:border-neutral-400'
                  }`}
                >
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
                <span
                  className={`text-xs sm:text-sm truncate transition-colors ${
                    isChecked
                      ? 'font-bold text-neutral-900'
                      : 'font-normal text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  {b.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range matching referral image */}
      <div className="flex flex-col gap-3">
        {/* Header row: MAX PRICE on left, value on right */}
        <div className="flex items-center justify-between">
          <span className="font-black text-xs sm:text-sm text-neutral-900 uppercase tracking-wider">
            MAX PRICE
          </span>
          <span className="font-black text-sm sm:text-base text-neutral-900">
            ₹{(maxPriceInput ? parseFloat(maxPriceInput) : 50000).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Range Slider matching referral image track & thumb */}
        <div className="py-1">
          <input
            type="range"
            min="0"
            max="50000"
            step="500"
            value={maxPriceInput ? parseFloat(maxPriceInput) : 50000}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onMouseUp={() => applyPriceFilter()}
            onPointerUp={() => applyPriceFilter()}
            onTouchEnd={() => applyPriceFilter()}
            className="price-slider"
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${Math.min(
                Math.max(
                  (((maxPriceInput ? parseFloat(maxPriceInput) : 50000) - 0) / 50000) * 100,
                  0
                ),
                100
              )}%, #e5e5e5 ${Math.min(
                Math.max(
                  (((maxPriceInput ? parseFloat(maxPriceInput) : 50000) - 0) / 50000) * 100,
                  0
                ),
                100
              )}%, #e5e5e5 100%)`,
            }}
          />
        </div>

        {/* Range bounds below slider */}
        <div className="flex items-center justify-between text-xs font-extrabold text-neutral-400 select-none">
          <span>₹0</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-neutral-800 hover:text-neutral-900 transition-colors">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => updateFilters('inStock', e.target.checked ? 'true' : null)}
            className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300 cursor-pointer accent-neutral-900"
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
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs self-start sticky top-[120px] max-h-[calc(100vh-135px)] overflow-y-auto overscroll-contain overscroll-y-contain no-scrollbar scrollbar-none">
        {filterContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar scrollbar-none z-50 animate-in slide-in-from-right duration-200">
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
