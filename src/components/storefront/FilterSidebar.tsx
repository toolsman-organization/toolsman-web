'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, X, Check, RotateCcw, ArrowUpDown, ChevronRight } from 'lucide-react';
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
  const [sortOpen, setSortOpen] = useState(false);

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

  // Lock body scroll when mobile filter sidebar or sort modal is open
  useEffect(() => {
    if (mobileOpen || sortOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [mobileOpen, sortOpen]);

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
  }, [mainCategories, subcategoriesMap, activeCategorySlugs]);

  const toggleExpand = (mainCatId: string) => {
    setExpandedMains((prev) => ({
      ...prev,
      [mainCatId]: !prev[mainCatId],
    }));
  };

  // Subcategory toggle handler
  const handleSubcategoryToggle = (sub: Category, parentCat: Category) => {
    const subs = subcategoriesMap[parentCat.id] || [];
    const isCurrentlyChecked = activeCategorySlugs.includes(sub.slug);

    let nextSlugs = [...activeCategorySlugs];

    if (isCurrentlyChecked) {
      nextSlugs = nextSlugs.filter((s) => s !== sub.slug);
      nextSlugs = nextSlugs.filter((s) => s !== parentCat.slug);
    } else {
      nextSlugs.push(sub.slug);
      const allSubsSelected = subs.length > 0 && subs.every((s) =>
        s.slug === sub.slug ? true : nextSlugs.includes(s.slug)
      );
      if (allSubsSelected && !nextSlugs.includes(parentCat.slug)) {
        nextSlugs.push(parentCat.slug);
      }
    }

    updateFilters('category', nextSlugs.length > 0 ? nextSlugs.join(',') : null);
  };

  const isSubcategoryChecked = (sub: Category) => {
    return activeCategorySlugs.includes(sub.slug);
  };

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput && parseFloat(minPriceInput) > 0) {
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

  const activeFilterCount =
    activeCategorySlugs.length +
    activeBrandSlugs.length +
    (currentInStock ? 1 : 0) +
    (currentMinPrice || currentMaxPrice ? 1 : 0);

  const hasActiveFilters = Boolean(
    currentCategory || currentBrand || currentInStock || currentMinPrice || currentMaxPrice || (currentSort && currentSort !== 'newest')
  );

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === currentSort)?.label || 'Newest';

  // Filter content with clear, comfortable typography and larger touch targets
  const filterBody = (
    <div className="flex flex-col gap-6">
      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {activeCategorySlugs.map((slug) => {
            const catObj = categories.find((c) => c.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  const updated = activeCategorySlugs.filter((s) => s !== slug);
                  updateFilters('category', updated.length > 0 ? updated.join(',') : null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 px-3 py-1 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <span>{catObj?.name || slug}</span>
                <X size={13} />
              </button>
            );
          })}
          {activeBrandSlugs.map((slug) => {
            const bObj = brands.find((b) => b.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => handleBrandToggle(slug)}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-neutral-900 text-white px-3 py-1 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <span>{bObj?.name || slug}</span>
                <X size={13} />
              </button>
            );
          })}
          {(currentMinPrice || currentMaxPrice) && (
            <button
              key="price-badge"
              type="button"
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('minPrice');
                params.delete('maxPrice');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-neutral-200 text-neutral-800 px-3 py-1 rounded-full hover:bg-neutral-300 transition-colors"
            >
              <span>₹{currentMinPrice || '0'} - ₹{currentMaxPrice || 'Any'}</span>
              <X size={13} />
            </button>
          )}
          {currentInStock && (
            <button
              key="stock-badge"
              type="button"
              onClick={() => updateFilters('inStock', null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors"
            >
              <span>In Stock</span>
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Hierarchical Categories Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-sm text-neutral-950 uppercase tracking-wider">
            CATEGORY
          </h4>
          {activeCategorySlugs.length > 0 && (
            <button
              type="button"
              onClick={() => updateFilters('category', null)}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto no-scrollbar scrollbar-none pr-1">
          {mainCategories.map((mainCat) => {
            const subs = subcategoriesMap[mainCat.id] || [];
            const isExpanded = expandedMains[mainCat.id] ?? false;
            const isMainActive = activeCategorySlugs.includes(mainCat.slug);
            const hasSubActive = subs.some((s) => activeCategorySlugs.includes(s.slug));

            if (subs.length > 0) {
              return (
                <div key={mainCat.id} className="flex flex-col rounded-xl">
                  {/* Main Category Row (Accordion Header) */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(mainCat.id)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl select-none cursor-pointer hover:bg-neutral-100 group transition-colors text-left"
                  >
                    <span
                      className={`text-sm sm:text-base truncate transition-colors ${
                        isMainActive || hasSubActive
                          ? 'font-bold text-neutral-950'
                          : 'font-medium text-neutral-700 group-hover:text-neutral-950'
                      }`}
                    >
                      {mainCat.name}
                    </span>

                    <ChevronRight
                      size={18}
                      className={`transition-transform duration-200 text-neutral-400 group-hover:text-neutral-800 shrink-0 ml-1 ${
                        isExpanded ? 'rotate-90 text-neutral-950 font-bold' : ''
                      }`}
                    />
                  </button>

                  {/* Subcategories Indented List */}
                  {isExpanded && (
                    <div className="pl-4 pr-1 py-1.5 space-y-1 border-l-2 border-neutral-200 ml-4 my-1">
                      {subs.map((sub) => {
                        const isSubChecked = isSubcategoryChecked(sub);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSubcategoryToggle(sub, mainCat)}
                            className="w-full flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-neutral-100 cursor-pointer select-none transition-colors group/sub text-left"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isSubChecked
                                  ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                                  : 'border-neutral-300 bg-white group-hover/sub:border-neutral-400'
                              }`}
                            >
                              {isSubChecked && <Check size={13} strokeWidth={3} />}
                            </div>
                            <span
                              className={`text-sm truncate transition-colors ${
                                isSubChecked
                                  ? 'font-bold text-neutral-950'
                                  : 'font-medium text-neutral-600 group-hover/sub:text-neutral-950'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </button>
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
              <div key={mainCat.id} className="flex flex-col rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    let nextSlugs: string[] = [];
                    if (isChecked) {
                      nextSlugs = activeCategorySlugs.filter((s) => s !== mainCat.slug);
                    } else {
                      nextSlugs = [...activeCategorySlugs, mainCat.slug];
                    }
                    updateFilters('category', nextSlugs.length > 0 ? nextSlugs.join(',') : null);
                  }}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-neutral-100 cursor-pointer select-none transition-colors group text-left"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                        : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-sm sm:text-base truncate transition-colors ${
                      isChecked
                        ? 'font-bold text-neutral-950'
                        : 'font-medium text-neutral-700 group-hover:text-neutral-950'
                    }`}
                  >
                    {mainCat.name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-sm text-neutral-950 uppercase tracking-wider">
            BRAND
          </h4>
          {activeBrandSlugs.length > 0 && (
            <button
              type="button"
              onClick={() => updateFilters('brand', null)}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto no-scrollbar scrollbar-none pr-1">
          {brands.map((b) => {
            const isChecked = activeBrandSlugs.includes(b.slug);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBrandToggle(b.slug)}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-neutral-50 cursor-pointer select-none transition-colors group/brand text-left"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                      : 'border-neutral-300 bg-white group-hover/brand:border-neutral-400'
                  }`}
                >
                  {isChecked && <Check size={13} strokeWidth={3} />}
                </div>
                <span
                  className={`text-sm sm:text-base truncate transition-colors ${
                    isChecked
                      ? 'font-bold text-neutral-950'
                      : 'font-medium text-neutral-700 hover:text-neutral-950'
                  }`}
                >
                  {b.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs sm:text-sm text-neutral-950 uppercase tracking-wider">
            MAX PRICE
          </span>
          <span className="font-black text-sm sm:text-base text-neutral-950">
            ₹{(maxPriceInput ? parseFloat(maxPriceInput) : 50000).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="py-2">
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

        <div className="flex items-center justify-between text-xs font-black text-neutral-400 select-none">
          <span>₹0</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-2 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => updateFilters('inStock', currentInStock ? null : 'true')}
          className="w-full flex items-center gap-3 py-2 px-1 cursor-pointer text-sm sm:text-base font-bold text-neutral-800 hover:text-neutral-950 transition-colors text-left"
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              currentInStock
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                : 'border-neutral-300 bg-white hover:border-neutral-400'
            }`}
          >
            {currentInStock && <Check size={13} strokeWidth={3} />}
          </div>
          <span>In Stock Only</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger Buttons: Split Filter & Sort Side-by-Side */}
      <div className="lg:hidden grid grid-cols-2 gap-2.5 w-full mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-3.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 shadow-2xs hover:border-neutral-400 active:scale-98 transition-all"
        >
          <Filter size={16} className="text-orange-600 shrink-0" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-3.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 shadow-2xs hover:border-neutral-400 active:scale-98 transition-all"
        >
          <ArrowUpDown size={16} className="text-orange-600 shrink-0" />
          <span className="truncate">{currentSortLabel}</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs self-start sticky top-[120px] max-h-[calc(100vh-135px)] overflow-y-auto overscroll-contain overscroll-y-contain no-scrollbar scrollbar-none">
        {/* Desktop Header */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-neutral-700" />
            <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset All</span>
            </button>
          )}
        </div>
        {filterBody}
      </aside>

      {/* Mobile Filter Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-[88vw] max-w-[360px] bg-white p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain no-scrollbar scrollbar-none z-50 animate-in slide-in-from-right duration-200">
            <div>
              {/* Single Clean Mobile Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <Filter size={20} className="text-orange-600" />
                  <h3 className="font-black text-neutral-950 text-lg uppercase tracking-wider">
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="Close filters"
                >
                  <X size={22} />
                </button>
              </div>
              {filterBody}
            </div>

            <div className="pt-4 mt-6 border-t border-neutral-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 py-3 px-3.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPriceFilter();
                  setMobileOpen(false);
                }}
                className="flex-1 py-3 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-orange-500/25 active:scale-98 transition-all"
              >
                Apply & View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Modal (Centered) */}
      {sortOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSortOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-5 sm:p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-orange-600" />
                <h3 className="font-black text-neutral-900 text-base uppercase tracking-wider">
                  Sort By
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Close sort"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2 py-1">
              {sortOptions.map((opt) => {
                const isSelected = currentSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateFilters('sort', opt.value === 'newest' ? null : opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-3 px-3.5 rounded-xl text-sm font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-orange-600 font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
