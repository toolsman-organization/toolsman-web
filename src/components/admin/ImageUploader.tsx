'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string, publicId?: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = 'toolsman',
  label = 'Upload Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPreview(base64);

        const res = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          onChange(data.url, data.public_id);
          setPreview(data.url);
        } else {
          alert(data.error || 'Failed to upload image');
        }
        setUploading(false);
      };
    } catch {
      alert('Error uploading file');
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-neutral-700">{label}</label>}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          preview
            ? 'border-orange-500/60 bg-neutral-50 hover:bg-neutral-100/60'
            : 'border-neutral-300 hover:border-orange-500 bg-neutral-50/50'
        } min-h-[140px]`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-orange-600">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs font-bold">Uploading to Cloudinary...</span>
          </div>
        ) : preview ? (
          <div className="relative w-full h-28 flex items-center justify-center">
            <Image
              src={preview}
              alt="Uploaded Preview"
              fill
              className="object-contain"
            />
            <button
              onClick={handleRemove}
              className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-colors"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-neutral-500 text-center">
            <div className="p-2.5 rounded-full bg-orange-50 text-orange-600 mb-1">
              <Upload size={18} />
            </div>
            <span className="text-xs font-bold text-neutral-700">Click to upload image</span>
            <span className="text-[10px] text-neutral-400">PNG, JPG, WebP up to 5MB</span>
          </div>
        )}
      </div>
    </div>
  );
}
