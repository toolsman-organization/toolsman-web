'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, Loader2, Star, Sparkles, Flame, Check, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import type { Category, Brand, ProductFullDetail } from '@/types/database';

interface ProductFormProps {
  categories: Category[];
  brands: Brand[];
  initialData?: ProductFullDetail | null;
}

export default function ProductForm({ categories, brands, initialData }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [productCode, setProductCode] = useState(initialData?.product_code || '');
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [brandId, setBrandId] = useState(initialData?.brand_id || '');
  const [originalPrice, setOriginalPrice] = useState(initialData?.original_price?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(initialData?.selling_price?.toString() || '');
  const [stockQuantity, setStockQuantity] = useState(initialData?.stock_quantity?.toString() || '10');

  // Badges & Status
  const [isActive, setIsActive] = useState(initialData ? initialData.is_active : true);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [isBestSeller, setIsBestSeller] = useState(initialData?.is_best_seller || false);
  const [isNew, setIsNew] = useState(initialData?.is_new || false);

  // Images State
  const [images, setImages] = useState<Array<{
    id?: string;
    image_url: string;
    cloudinary_public_id?: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>>(
    initialData?.images?.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      cloudinary_public_id: img.cloudinary_public_id || undefined,
      alt_text: img.alt_text || '',
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })) || []
  );

  // Specifications State
  const [specs, setSpecs] = useState<Array<{
    id?: string;
    name: string;
    value: string;
  }>>(
    initialData?.specifications?.map((s) => ({
      id: s.id,
      name: s.specification_name,
      value: s.specification_value,
    })) || [
      { name: 'Voltage', value: '20V' },
      { name: 'Motor Type', value: 'Brushless' },
    ]
  );

  // Auto-generate slug when name changes (if creating)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData) {
      setSlug(slugify(val));
    }
  };

  // Image Upload handler
  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'toolsman/products' }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          const isFirst = images.length === 0;
          setImages((prev) => [
            ...prev,
            {
              image_url: data.url,
              cloudinary_public_id: data.public_id,
              alt_text: name,
              is_primary: isFirst,
              sort_order: prev.length,
            },
          ]);
        }
      } catch {
        alert('Image upload failed');
      }
    };
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  // Spec handlers
  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, { name: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSpec = (index: number, key: 'name' | 'value', val: string) => {
    setSpecs((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [key]: val } : s))
    );
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !productCode || !sellingPrice) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const productPayload = {
        name,
        slug: slugify(slug),
        product_code: productCode.trim().toUpperCase(),
        short_description: shortDescription || null,
        description: description || null,
        category_id: categoryId || null,
        brand_id: brandId || null,
        original_price: parseFloat(originalPrice) || parseFloat(sellingPrice),
        selling_price: parseFloat(sellingPrice),
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        is_active: isActive,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_new: isNew,
      };

      let productId = initialData?.id;

      if (initialData) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', initialData.id);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { data: newProd, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();

        if (insertError || !newProd) throw insertError || new Error('Insert failed');
        productId = newProd.id;
      }

      if (productId) {
        // Handle images: delete previous and reinsert
        await supabase.from('product_images').delete().eq('product_id', productId);
        if (images.length > 0) {
          const imagesToInsert = images.map((img, i) => ({
            product_id: productId,
            image_url: img.image_url,
            cloudinary_public_id: img.cloudinary_public_id || null,
            alt_text: img.alt_text || name,
            sort_order: i,
            is_primary: img.is_primary,
          }));
          await supabase.from('product_images').insert(imagesToInsert);
        }

        // Handle specifications: delete previous and reinsert
        await supabase.from('product_specifications').delete().eq('product_id', productId);
        const validSpecs = specs.filter((s) => s.name.trim() && s.value.trim());
        if (validSpecs.length > 0) {
          const specsToInsert = validSpecs.map((s, i) => ({
            product_id: productId,
            specification_name: s.name.trim(),
            specification_value: s.value.trim(),
            sort_order: i,
          }));
          await supabase.from('product_specifications').insert(specsToInsert);
        }
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save product');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-xs">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1. Basic Details Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="font-black text-base text-neutral-900 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100">
          Basic Product Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. 20V Brushless Angle Grinder"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              SKU / Product Code *
            </label>
            <input
              type="text"
              required
              value={productCode}
              onChange={(e) => setProductCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-mono text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. CAGLI21154"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono focus:outline-none focus:border-orange-500"
              placeholder="e.g. 20v-brushless-angle-grinder"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Brand
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Short Summary
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
              placeholder="Brief 1-sentence product summary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Full Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
              placeholder="Detailed product features, packaging, warranty, application guide..."
            />
          </div>
        </div>
      </div>

      {/* 2. Pricing & Inventory Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <h2 className="font-black text-base text-neutral-900 uppercase tracking-tight pb-3 mb-4 border-b border-neutral-100">
          Pricing & Stock
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Original / MRP (₹)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
              placeholder="e.g. 4799"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-orange-400 bg-orange-50/20 font-black text-sm text-neutral-900 focus:outline-none focus:border-orange-500"
              placeholder="e.g. 4199"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
              placeholder="e.g. 15"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-neutral-100">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
            />
            <span>Active on Store</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
            />
            <span className="flex items-center gap-1"><Star size={13} className="text-amber-500" /> Featured</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
            />
            <span className="flex items-center gap-1"><Flame size={13} className="text-orange-500" /> Best Seller</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
            />
            <span className="flex items-center gap-1"><Sparkles size={13} className="text-emerald-500" /> New Arrival</span>
          </label>
        </div>
      </div>

      {/* 3. Product Images (Cloudinary) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
          <div>
            <h2 className="font-black text-base text-neutral-900 uppercase tracking-tight">
              Product Images ({images.length})
            </h2>
            <p className="text-[11px] text-neutral-500">
              Upload multiple images to Cloudinary. Click &quot;Set Primary&quot; to choose the main thumbnail.
            </p>
          </div>

          <label className="btn-secondary py-1.5 px-3 cursor-pointer text-xs font-bold flex items-center gap-1.5">
            <Upload size={14} />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddImageUpload}
            />
          </label>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl border-2 p-2 bg-neutral-50 flex flex-col items-center justify-between ${
                  img.is_primary ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-neutral-200'
                }`}
              >
                <div className="relative w-full aspect-square mb-2">
                  <Image src={img.image_url} alt="Product image" fill className="object-contain" />
                </div>

                <div className="w-full flex items-center justify-between pt-1 border-t border-neutral-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(idx)}
                    className={`font-bold ${img.is_primary ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    {img.is_primary ? '★ Primary' : 'Set Primary'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="text-red-500 hover:text-red-700 p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-neutral-400">
            No images uploaded yet. Click &quot;Upload Image&quot; to add photos.
          </div>
        )}
      </div>

      {/* 4. Specifications Builder */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
          <div>
            <h2 className="font-black text-base text-neutral-900 uppercase tracking-tight">
              Technical Specifications ({specs.length})
            </h2>
            <p className="text-[11px] text-neutral-500">
              Add technical specs such as Voltage, Battery Capacity, RPM, Chuck Size, Weight.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSpec}
            className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Spec Row</span>
          </button>
        </div>

        <div className="space-y-2">
          {specs.map((spec, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                value={spec.name}
                onChange={(e) => handleUpdateSpec(idx, 'name', e.target.value)}
                placeholder="Specification Name (e.g. Voltage)"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 font-semibold"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                placeholder="Value (e.g. 20V Lithium-Ion)"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="p-2 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="py-3 px-6 rounded-lg border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Product...</span>
            </>
          ) : (
            <span>{initialData ? 'Update Product' : 'Publish Product'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
