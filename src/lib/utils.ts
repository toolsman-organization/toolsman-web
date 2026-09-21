import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencySymbol = '₹'): string {
  return `${currencySymbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateDiscount(original: number, selling: number): number {
  if (original <= 0 || selling >= original) return 0;
  return Math.round(((original - selling) / original) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getOrderStatusColor(status: string): string {
  const normalized = status === 'pending' ? 'awaiting_payment' : status;
  const colors: Record<string, string> = {
    awaiting_payment: 'bg-amber-100 text-amber-800 border border-amber-200',
    pending:          'bg-amber-100 text-amber-800 border border-amber-200',
    confirmed:        'bg-blue-100 text-blue-800 border border-blue-200',
    processing:       'bg-indigo-100 text-indigo-800 border border-indigo-200',
    packed:           'bg-purple-100 text-purple-800 border border-purple-200',
    shipped:          'bg-cyan-100 text-cyan-800 border border-cyan-200',
    delivered:        'bg-emerald-100 text-emerald-800 border border-emerald-200',
    cancelled:        'bg-rose-100 text-rose-800 border border-rose-200',
  };
  return colors[normalized] ?? 'bg-gray-100 text-gray-800 border border-gray-200';
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-800 border border-amber-200',
    paid:     'bg-emerald-100 text-emerald-800 border border-emerald-200',
    failed:   'bg-rose-100 text-rose-800 border border-rose-200',
    expired:  'bg-neutral-100 text-neutral-700 border border-neutral-200',
    refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800 border border-gray-200';
}

export function formatFulfillmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    awaiting_payment: 'Awaiting Payment',
    pending:          'Awaiting Payment',
    confirmed:        'Confirmed',
    processing:       'Processing',
    packed:           'Packed',
    shipped:          'Shipped',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

export function formatPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:  'Pending',
    paid:     'Paid',
    failed:   'Failed',
    expired:  'Expired',
    refunded: 'Refunded',
  };
  return labels[status] ?? status.replace(/_/g, ' ');
}

export function buildProductUrl(slug: string): string {
  return `/product/${slug}`;
}

export function buildCategoryUrl(slug: string): string {
  return `/shop?category=${slug}`;
}

export function buildBrandUrl(slug: string): string {
  return `/shop?brand=${slug}`;
}

/**
 * Automatically compress an image file client-side before uploading to Cloudinary.
 * Scales down large camera photos to max 1200px and converts to WebP (quality 0.75).
 * Reduces image file sizes from ~5MB down to ~30-60KB, preserving free-tier Cloudinary storage.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to WebP data URL with 0.75 quality (~30KB-60KB size)
        const compressedDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

