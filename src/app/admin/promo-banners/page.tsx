'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Link2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Banner } from '@/types/database';

interface CleanSlotState {
  id?: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  mobileImageUrl: string;
  mobileCloudinaryPublicId: string;
  buttonLink: string;
  isActive: boolean;
}

const INITIAL_SLOT_1: CleanSlotState = {
  imageUrl: '',
  cloudinaryPublicId: '',
  mobileImageUrl: '',
  mobileCloudinaryPublicId: '',
  buttonLink: '/shop',
  isActive: true,
};

const INITIAL_SLOT_2: CleanSlotState = {
  imageUrl: '',
  cloudinaryPublicId: '',
  mobileImageUrl: '',
  mobileCloudinaryPublicId: '',
  buttonLink: '/shop',
  isActive: true,
};

export default function AdminPromoBannersPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [slot1, setSlot1] = useState<CleanSlotState>({ ...INITIAL_SLOT_1 });
  const [slot2, setSlot2] = useState<CleanSlotState>({ ...INITIAL_SLOT_2 });

  const loadPromoBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('position', 'promo')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching promo banners:', error);
      setLoading(false);
      return;
    }

    const items: Banner[] = data || [];

    if (items.length > 0 && items[0]) {
      const b = items[0];
      setSlot1({
        id: b.id,
        imageUrl: b.image_url || '',
        cloudinaryPublicId: b.cloudinary_public_id || '',
        mobileImageUrl: b.mobile_image_url || '',
        mobileCloudinaryPublicId: b.mobile_cloudinary_public_id || '',
        buttonLink: b.button_link || '/shop',
        isActive: b.is_active,
      });
    } else {
      setSlot1({ ...INITIAL_SLOT_1 });
    }

    if (items.length > 1 && items[1]) {
      const b = items[1];
      setSlot2({
        id: b.id,
        imageUrl: b.image_url || '',
        cloudinaryPublicId: b.cloudinary_public_id || '',
        mobileImageUrl: b.mobile_image_url || '',
        mobileCloudinaryPublicId: b.mobile_cloudinary_public_id || '',
        buttonLink: b.button_link || '/shop',
        isActive: b.is_active,
      });
    } else {
      setSlot2({ ...INITIAL_SLOT_2 });
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPromoBanners();
  }, []);

  const handleSaveSlot = async (slotNumber: 1 | 2) => {
    const slotData = slotNumber === 1 ? slot1 : slot2;
    if (!slotData.imageUrl.trim()) {
      alert(`Please upload a desktop banner image for Slot ${slotNumber}`);
      return;
    }

    setSavingSlot(slotNumber);
    setSuccessMsg(null);

    try {
      const payload = {
        title: `Promo Banner ${slotNumber}`,
        subtitle: null,
        image_url: slotData.imageUrl.trim(),
        cloudinary_public_id: slotData.cloudinaryPublicId || null,
        mobile_image_url: slotData.mobileImageUrl ? slotData.mobileImageUrl.trim() : null,
        mobile_cloudinary_public_id: slotData.mobileCloudinaryPublicId || null,
        button_text: null,
        button_link: slotData.buttonLink ? slotData.buttonLink.trim() : '/shop',
        position: 'promo' as const,
        sort_order: slotNumber,
        is_active: slotData.isActive,
        updated_at: new Date().toISOString(),
      };

      if (slotData.id) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', slotData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('banners')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        if (data?.id) {
          if (slotNumber === 1) setSlot1((prev) => ({ ...prev, id: data.id }));
          else setSlot2((prev) => ({ ...prev, id: data.id }));
        }
      }

      setSuccessMsg(`Promo Banner Slot ${slotNumber} saved successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadPromoBanners();
    } catch (err: unknown) {
      alert((err as Error).message || `Failed to save Slot ${slotNumber}`);
    } finally {
      setSavingSlot(null);
    }
  };

  const handleDeleteSlot = async (slotNumber: 1 | 2) => {
    const slotData = slotNumber === 1 ? slot1 : slot2;
    if (!slotData.id) {
      if (slotNumber === 1) setSlot1({ ...INITIAL_SLOT_1 });
      else setSlot2({ ...INITIAL_SLOT_2 });
      return;
    }

    if (!confirm(`Are you sure you want to remove Promo Banner Slot ${slotNumber}?`)) return;

    try {
      await supabase.from('banners').delete().eq('id', slotData.id);
      if (slotNumber === 1) setSlot1({ ...INITIAL_SLOT_1 });
      else setSlot2({ ...INITIAL_SLOT_2 });
      setSuccessMsg(`Promo Banner Slot ${slotNumber} deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadPromoBanners();
    } catch (err) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-xs text-neutral-500 font-bold">Loading Promo Banners...</p>
      </div>
    );
  }

  const renderSlotCard = (
    slotNumber: 1 | 2,
    slot: CleanSlotState,
    setSlot: React.Dispatch<React.SetStateAction<CleanSlotState>>
  ) => {
    const isSaving = savingSlot === slotNumber;

    return (
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {slotNumber}
            </span>
            <div>
              <h2 className="font-black text-sm sm:text-base text-neutral-950 uppercase tracking-wider">
                {slotNumber === 1 ? 'Slot 1: Left Banner' : 'Slot 2: Right Banner'}
              </h2>
              <span className="text-[11px] text-neutral-500">
                {slotNumber === 1 ? 'Appears on the left side' : 'Appears on the right side'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSlot((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                slot.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
              }`}
            >
              {slot.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span>{slot.isActive ? 'Active' : 'Disabled'}</span>
            </button>
            {slot.id && (
              <button
                type="button"
                onClick={() => handleDeleteSlot(slotNumber)}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove this banner"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Upload & Link Form */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Banner Live Preview */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-orange-600" />
              <span>Banner Preview</span>
            </label>
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 flex items-center justify-center shadow-xs">
              {slot.imageUrl ? (
                <Image
                  src={slot.imageUrl}
                  alt={`Banner Slot ${slotNumber}`}
                  fill
                  className="object-cover"
                  sizes="600px"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-neutral-400 text-center p-4">
                  <ImageIcon size={28} className="text-neutral-500 opacity-60" />
                  <span className="text-xs font-bold">No Image Uploaded</span>
                  <span className="text-[10px] text-neutral-500">Upload a banner image below to preview</span>
                </div>
              )}
            </div>
          </div>

          {/* 1. Desktop Banner Upload */}
          <div>
            <ImageUploader
              value={slot.imageUrl}
              onChange={(url, publicId) =>
                setSlot((prev) => ({
                  ...prev,
                  imageUrl: url,
                  cloudinaryPublicId: publicId || '',
                }))
              }
              label="Desktop Banner Artwork Image *"
              folder="toolsman/promo-banners"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block font-medium">
              Recommended format: 900×450px or 1200×600px horizontal image (PNG, JPG, WebP)
            </span>
          </div>

          {/* 2. Mobile Banner Upload (Optional) */}
          <div>
            <ImageUploader
              value={slot.mobileImageUrl}
              onChange={(url, publicId) =>
                setSlot((prev) => ({
                  ...prev,
                  mobileImageUrl: url,
                  mobileCloudinaryPublicId: publicId || '',
                }))
              }
              label="Mobile Banner Artwork Image (Optional)"
              folder="toolsman/promo-banners"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block font-medium">
              Optional: Specific cropped image for mobile screens (e.g. 600×400px)
            </span>
          </div>

          {/* 3. Click Target Link */}
          <div>
            <label className="text-[11px] font-black uppercase text-neutral-700 mb-1 flex items-center gap-1.5">
              <Link2 size={13} className="text-orange-600" />
              <span>Redirect Link (When User Clicks Banner)</span>
            </label>
            <input
              type="text"
              value={slot.buttonLink}
              onChange={(e) =>
                setSlot((prev) => ({
                  ...prev,
                  buttonLink: e.target.value,
                }))
              }
              placeholder="/shop or /shop?category=cordless-tools"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold font-mono focus:outline-none focus:border-orange-500 bg-white"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Example: <code>/shop</code>, <code>/category/power-tools</code>, or any product URL.
            </span>
          </div>
        </div>

        {/* Save Footer */}
        <div className="p-5 sm:p-6 border-t border-neutral-100 bg-neutral-50/50">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveSlot(slotNumber)}
            className="btn-primary w-full py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Banner {slotNumber}...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Banner Slot {slotNumber}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
            <Sparkles size={14} />
            <span>Marketing & Promotions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Promo Banners (2-Banner Grid)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Upload the 2 promotional banner images displayed side-by-side in the middle of the storefront homepage.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 shadow-2xs self-start sm:self-auto transition-colors"
        >
          <span>View Storefront</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2-Banner Slot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {renderSlotCard(1, slot1, setSlot1)}
        {renderSlotCard(2, slot2, setSlot2)}
      </div>
    </div>
  );
}
