'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types/database';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const displayImages = images.length > 0 ? images : [
    {
      id: 'fallback',
      product_id: '',
      image_url: '/placeholder-product.svg',
      cloudinary_public_id: null,
      alt_text: productName,
      sort_order: 0,
      is_primary: true,
      created_at: '',
    }
  ];

  const currentImage = displayImages[selectedIdx] || displayImages[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[480px] pb-2 md:pb-0 scrollbar-none shrink-0">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg p-1.5 bg-white border-2 transition-all shrink-0 overflow-hidden ${
                idx === selectedIdx
                  ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || `${productName} thumbnail ${idx + 1}`}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Large Image */}
      <div className="relative flex-1 aspect-square max-h-[500px] w-full bg-white rounded-2xl border border-neutral-200/80 p-6 flex items-center justify-center overflow-hidden shadow-sm">
        <Image
          src={currentImage.image_url}
          alt={currentImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4 hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
}
