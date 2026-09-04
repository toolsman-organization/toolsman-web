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
    <div className="flex flex-col-reverse md:flex-row gap-3 sm:gap-4 w-full">
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[440px] pb-1.5 md:pb-0 scrollbar-none shrink-0">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-lg p-1 bg-white border-2 transition-all shrink-0 overflow-hidden ${
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
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Large Image */}
      <div className="relative flex-1 aspect-square max-h-[300px] xs:max-h-[340px] sm:max-h-[400px] lg:max-h-[460px] w-full bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 p-3 sm:p-5 flex items-center justify-center overflow-hidden shadow-2xs">
        <Image
          src={currentImage.image_url}
          alt={currentImage.alt_text || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-2 sm:p-3 hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
}
