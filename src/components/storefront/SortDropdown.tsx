'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

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

  const activeSort = searchParams.get('sort') || currentSort || 'newest';

  const handleSortChange = (newSort: string) => {
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
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5">
        <ArrowUpDown size={13} className="text-orange-600" />
        <span>Sort By:</span>
      </span>

      <div className="relative inline-block">
        <select
          value={activeSort}
          onChange={(e) => handleSortChange(e.target.value)}
          aria-label="Sort products"
          className="appearance-none bg-white border border-neutral-300 hover:border-neutral-400 focus:border-orange-500 text-xs sm:text-sm font-bold text-neutral-800 rounded-lg pl-3 pr-8 py-2 outline-none shadow-2xs transition-colors cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
        />
      </div>
    </div>
  );
}
