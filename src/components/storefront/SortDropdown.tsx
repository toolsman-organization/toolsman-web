'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';

interface SortDropdownProps {
  currentSort?: string;
}

const sortOptions = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'popular', label: 'Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

export default function SortDropdown({ currentSort = 'newest' }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSort = searchParams.get('sort') || currentSort || 'newest';
  const activeLabel = sortOptions.find((opt) => opt.value === activeSort)?.label || 'Newest Arrivals';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (newSort: string) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== 'newest') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    params.delete('page'); // Reset to page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" ref={dropdownRef}>
      <span className="text-xs font-black text-neutral-700 uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5 select-none">
        <ArrowUpDown size={14} className="text-orange-500" />
        <span>Sort By:</span>
      </span>

      <div className="relative inline-block min-w-[160px] sm:min-w-[185px]">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between gap-2 bg-white border text-xs sm:text-sm font-extrabold text-neutral-900 rounded-xl px-3.5 py-2 transition-all duration-150 cursor-pointer select-none shadow-2xs ${
            isOpen
              ? 'border-orange-500 ring-2 ring-orange-500/20'
              : 'border-neutral-300 hover:border-orange-500'
          }`}
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDown
            size={14}
            className={`text-orange-500 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Custom Popover Menu */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute right-0 top-full mt-1.5 w-full min-w-[185px] bg-white border border-neutral-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
          >
            {sortOptions.map((opt) => {
              const isSelected = activeSort === opt.value;
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSortChange(opt.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-orange-50 text-orange-600 font-black'
                      : 'text-neutral-700 hover:bg-orange-50/60 hover:text-orange-600 font-bold'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-orange-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
