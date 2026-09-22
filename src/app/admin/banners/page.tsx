'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  Image as ImageIcon,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Banner } from '@/types/database';
import {
  parseBannerContent,
  serializeBannerContent,
  BANNER_COLOR_PRESETS,
  DEFAULT_BANNER_CONTENT,
  type SimpleBannerContent,
} from '@/lib/bannerHelper';

export default function AdminBannersPage() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form states
  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [mobileCloudinaryPublicId, setMobileCloudinaryPublicId] = useState('');
  const [position, setPosition] = useState<'hero' | 'promo' | 'sidebar'>('hero');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Content states
  const [content, setContent] = useState<SimpleBannerContent>({ ...DEFAULT_BANNER_CONTENT });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openAddModal = () => {
    setEditingBanner(null);
    setImageUrl('');
    setCloudinaryPublicId('');
    setMobileImageUrl('');
    setMobileCloudinaryPublicId('');
    setPosition('hero');
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setContent({ ...DEFAULT_BANNER_CONTENT });
    setModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.image_url || '');
    setCloudinaryPublicId(banner.cloudinary_public_id || '');
    setMobileImageUrl(banner.mobile_image_url || '');
    setMobileCloudinaryPublicId(banner.mobile_cloudinary_public_id || '');
    setPosition(banner.position);
    setSortOrder(banner.sort_order);
    setIsActive(banner.is_active);

    const parsed = parseBannerContent(banner);
    setContent(parsed);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please upload a desktop banner image');
      return;
    }

    setSubmitting(true);
    try {
      const serialized = serializeBannerContent(content);

      const bannerData = {
        title: serialized.title,
        subtitle: serialized.subtitle,
        image_url: imageUrl,
        cloudinary_public_id: cloudinaryPublicId || null,
        mobile_image_url: mobileImageUrl || null,
        mobile_cloudinary_public_id: mobileCloudinaryPublicId || null,
        button_text: content.show_overlay ? content.button_text || 'SHOP NOW' : null,
        button_link: content.button_link || '/shop',
        position,
        sort_order: sortOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert([bannerData]);
        if (error) throw error;
      }

      setModalOpen(false);
      await loadBanners();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setDeleteTarget(null);
      await loadBanners();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete banner');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    if (!error) {
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
    }
  };

  const [selectedTab, setSelectedTab] = useState<'all' | 'hero' | 'promo'>('all');

  const filteredBanners = banners.filter((b) => {
    if (selectedTab === 'all') return true;
    return b.position === selectedTab;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Marketing & Promotions
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Hero & Promo Banners
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {[
          { id: 'all', label: `All Banners (${banners.length})` },
          { id: 'hero', label: `Hero Carousel (${banners.filter(b => b.position === 'hero').length})` },
          { id: 'promo', label: `Mid-Page Promo Grid (${banners.filter(b => b.position === 'promo').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as 'all' | 'hero' | 'promo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === tab.id
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-500 font-semibold">Loading banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800 mb-1">No Banners Found</h3>
          <p className="text-xs text-neutral-500 mb-4 max-w-sm mx-auto">
            {selectedTab === 'promo'
              ? 'Add 2 mid-page promotional banners to show in the 2-banner advertising grid.'
              : 'Add promotional banners for the storefront homepage carousel or mid-page promotions.'}
          </p>
          <button onClick={openAddModal} className="btn-primary text-xs py-2 px-4">
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((banner) => {
            const parsed = parseBannerContent(banner);
            return (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Banner Thumbnail Preview */}
                <div className="relative w-full h-44 bg-neutral-900 overflow-hidden">
                  {banner.image_url ? (
                    <Image
                      src={banner.image_url}
                      alt={banner.title || 'Banner Image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-bold">
                      No Image Uploaded
                    </div>
                  )}

                  {/* Gradient Overlay Preview */}
                  {parsed.show_overlay && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end">
                      {parsed.badge && (
                        <span
                          className="text-[9px] font-black uppercase tracking-wider mb-1"
                          style={{ color: parsed.badge_color || '#f97316' }}
                        >
                          {parsed.badge}
                        </span>
                      )}
                      <div className="font-serif font-black text-lg uppercase leading-tight line-clamp-1">
                        <span style={{ color: parsed.line1_color || '#ffffff' }}>
                          {parsed.line1_text}{' '}
                        </span>
                        <span style={{ color: parsed.line2_color || '#f97316' }}>
                          {parsed.line2_text}
                        </span>
                      </div>
                      {parsed.subtitle && (
                        <p className="font-serif italic text-[11px] text-neutral-300 line-clamp-1 mt-0.5 tracking-wide">
                          {parsed.subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Position Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-white/10">
                      {banner.position === 'hero' ? 'Hero Slider' : 'Promo Banner'}
                    </span>
                  </div>

                  {/* Sort Order Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-neutral-900/80 text-orange-400 font-mono text-[10px] font-bold px-2 py-1 rounded-md border border-neutral-700">
                      #{banner.sort_order}
                    </span>
                  </div>
                </div>

                {/* Card Details & Actions */}
                <div className="p-4 flex items-center justify-between border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`p-1 rounded-md hover:bg-neutral-100 ${
                        banner.is_active ? 'text-emerald-600' : 'text-neutral-400'
                      }`}
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {banner.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        banner.is_active ? 'text-emerald-700' : 'text-neutral-500'
                      }`}
                    >
                      {banner.is_active ? 'Active' : 'Draft / Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 hover:text-orange-600 rounded-lg hover:bg-orange-50 text-neutral-600 transition-colors"
                      title="Edit Banner"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(banner)}
                      className="p-2 hover:text-red-600 rounded-lg hover:bg-red-50 text-neutral-600 transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simplified Add / Edit Banner Modal (No Split Screen Preview) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
              <div>
                <h2 className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-tight">
                  {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  Configure background image, headline text, and button link.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* 1. Placement & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Banner Placement
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as 'hero' | 'promo' | 'sidebar')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="hero">Hero Carousel (Top Homepage Slider)</option>
                    <option value="promo">Mid-Page Promo (2-Banner Advertising Grid)</option>
                  </select>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {position === 'promo'
                      ? 'Appears in the 2-banner advertising grid in the middle of the homepage.'
                      : 'Appears in the main top hero carousel.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Display Order / Position #{position === 'promo' ? '(1 = Left, 2 = Right)' : ''}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {position === 'promo'
                      ? 'Set to 1 for Left Banner, 2 for Right Banner.'
                      : 'Sequence in the hero slider carousel.'}
                  </p>
                </div>
              </div>

              {/* 2. Banner Background Images */}
              <div className="space-y-4 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    Desktop Banner Image <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    High-resolution horizontal artwork (recommended 1920×700 or 1920×800px).
                  </p>
                  <ImageUploader
                    value={imageUrl}
                    onChange={(url, publicId) => {
                      setImageUrl(url);
                      if (publicId) setCloudinaryPublicId(publicId);
                    }}
                    folder="banners"
                    label="Upload Desktop Banner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                    Mobile Banner Image (Optional)
                  </label>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    Vertical or compact artwork tailored for mobile screens (e.g. 800×900px).
                  </p>
                  <ImageUploader
                    value={mobileImageUrl}
                    onChange={(url, publicId) => {
                      setMobileImageUrl(url);
                      if (publicId) setMobileCloudinaryPublicId(publicId);
                    }}
                    folder="banners"
                    label="Upload Mobile Banner (Optional)"
                  />
                </div>
              </div>

              {/* 3. Text Overlay Toggle */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={content.show_overlay !== false}
                    onChange={(e) => setContent({ ...content, show_overlay: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-neutral-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      Enable Headline & Text Overlay
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Uncheck if your image already includes printed typography graphic text.
                    </span>
                  </div>
                </label>
              </div>

              {/* 4. Text Overlay Content (Lines & Colors) */}
              {content.show_overlay !== false && (
                <div className="space-y-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  {/* Badge / Tagline */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Top Badge / Tag (Optional)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {BANNER_COLOR_PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setContent({ ...content, badge_color: p.value })}
                            className={`w-4 h-4 rounded-full border border-neutral-300 transition-transform ${
                              content.badge_color === p.value ? 'scale-125 ring-2 ring-orange-500' : ''
                            }`}
                            style={{ backgroundColor: p.value }}
                            title={p.label}
                          />
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={content.badge || ''}
                      onChange={(e) => setContent({ ...content, badge: e.target.value })}
                      placeholder="e.g. Professional Tools Store"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 bg-white"
                    />
                  </div>

                  {/* Heading Line 1 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Heading Line 1
                      </label>
                      <div className="flex items-center gap-1.5">
                        {BANNER_COLOR_PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setContent({ ...content, line1_color: p.value })}
                            className={`w-4 h-4 rounded-full border border-neutral-300 transition-transform ${
                              content.line1_color === p.value ? 'scale-125 ring-2 ring-orange-500' : ''
                            }`}
                            style={{ backgroundColor: p.value }}
                            title={p.label}
                          />
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={content.line1_text || ''}
                      onChange={(e) => setContent({ ...content, line1_text: e.target.value })}
                      placeholder="e.g. BUILT FOR"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-black uppercase tracking-tight focus:outline-none focus:border-orange-500 bg-white"
                    />
                  </div>

                  {/* Heading Line 2 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Heading Line 2
                      </label>
                      <div className="flex items-center gap-1.5">
                        {BANNER_COLOR_PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setContent({ ...content, line2_color: p.value })}
                            className={`w-4 h-4 rounded-full border border-neutral-300 transition-transform ${
                              content.line2_color === p.value ? 'scale-125 ring-2 ring-orange-500' : ''
                            }`}
                            style={{ backgroundColor: p.value }}
                            title={p.label}
                          />
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={content.line2_text || ''}
                      onChange={(e) => setContent({ ...content, line2_text: e.target.value })}
                      placeholder="e.g. THE JOB."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-black uppercase tracking-tight focus:outline-none focus:border-orange-500 bg-white"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Subtitle / Brief Description
                    </label>
                    <input
                      type="text"
                      value={content.subtitle || ''}
                      onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                      placeholder="e.g. Heavy-duty power tools & industrial accessories."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-orange-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 5. Button CTA & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={content.button_text || ''}
                    onChange={(e) => setContent({ ...content, button_text: e.target.value })}
                    placeholder="e.g. SHOP NOW"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-bold uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Button Destination URL
                  </label>
                  <input
                    type="text"
                    value={content.button_link || ''}
                    onChange={(e) => setContent({ ...content, button_link: e.target.value })}
                    placeholder="e.g. /shop or /shop?category=power-tools"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 6. Active Status */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Banner Status</span>
                  <span className="text-[11px] text-neutral-500">
                    Publish immediately on storefront or save as inactive draft.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`p-1 rounded-md hover:bg-neutral-100 ${
                    isActive ? 'text-emerald-600' : 'text-neutral-400'
                  }`}
                >
                  {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Banner...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{editingBanner ? 'Update Banner' : 'Publish Banner'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-950 uppercase tracking-tight">
                  Delete Banner
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Are you sure you want to delete this banner?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
