'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  Layers,
  Sparkles,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
  X,
  Monitor,
  Smartphone,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import type { Banner } from '@/types/database';
import {
  parseBannerContent,
  serializeBannerContent,
  BANNER_COLOR_PRESETS,
  BANNER_ICON_OPTIONS,
  DEFAULT_BANNER_TEMPLATE,
  type BannerStructuredContent,
  type BannerHeadingLine,
  type BannerFeatureItem,
  type BannerFeatureIcon,
  type BannerHeadingSize,
  type BannerHeadingWeight,
  type BannerHorizontalPosition,
  type BannerVerticalPosition,
  type BannerButtonStyle,
} from '@/lib/bannerHelper';
import { BannerContentView } from '@/components/storefront/HeroBanner';

export default function AdminBannersPage() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'content' | 'features' | 'cta' | 'settings'>('content');

  // Basic fields
  const [imageUrl, setImageUrl] = useState('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [mobileCloudinaryPublicId, setMobileCloudinaryPublicId] = useState('');
  const [position, setPosition] = useState<'hero' | 'promo' | 'sidebar'>('hero');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Structured Content Builder fields
  const [structuredContent, setStructuredContent] = useState<BannerStructuredContent>({
    ...DEFAULT_BANNER_TEMPLATE,
  });

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
    setStructuredContent({
      ...DEFAULT_BANNER_TEMPLATE,
      show_overlay: true,
      heading_lines: [
        {
          id: `h-${Date.now()}-1`,
          text: 'BUILT FOR',
          color: '#ffffff',
          size: 'extra-large',
          weight: 'black',
        },
        {
          id: `h-${Date.now()}-2`,
          text: 'THE JOB.',
          color: '#f97316',
          size: 'extra-large',
          weight: 'black',
        },
      ],
      features: [
        { id: `f-${Date.now()}-1`, icon: 'shield', title: 'SALES', description: 'Buy with confidence' },
        { id: `f-${Date.now()}-2`, icon: 'wrench', title: 'SERVICE', description: 'After sales support' },
        { id: `f-${Date.now()}-3`, icon: 'headphones', title: 'SUPPORT', description: 'We are here to help' },
      ],
    });
    setActiveTab('content');
    setModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setImageUrl(b.image_url || '');
    setCloudinaryPublicId(b.cloudinary_public_id || '');
    setMobileImageUrl(b.mobile_image_url || '');
    setMobileCloudinaryPublicId(b.mobile_cloudinary_public_id || '');
    setPosition(b.position);
    setSortOrder(b.sort_order);
    setIsActive(b.is_active);

    const parsed = parseBannerContent(b);
    setStructuredContent(parsed);
    setActiveTab('content');
    setModalOpen(true);
  };

  // Heading Lines helpers
  const addHeadingLine = () => {
    const newLine: BannerHeadingLine = {
      id: `h-${Date.now()}`,
      text: 'NEW HEADLINE',
      color: '#ffffff',
      size: 'extra-large',
      weight: 'black',
    };
    setStructuredContent({
      ...structuredContent,
      heading_lines: [...structuredContent.heading_lines, newLine],
    });
  };

  const updateHeadingLine = (index: number, updates: Partial<BannerHeadingLine>) => {
    const lines = [...structuredContent.heading_lines];
    lines[index] = { ...lines[index], ...updates };
    setStructuredContent({ ...structuredContent, heading_lines: lines });
  };

  const removeHeadingLine = (index: number) => {
    if (structuredContent.heading_lines.length <= 1) {
      alert('You must have at least one heading line');
      return;
    }
    const lines = structuredContent.heading_lines.filter((_, i) => i !== index);
    setStructuredContent({ ...structuredContent, heading_lines: lines });
  };

  const moveHeadingLine = (index: number, direction: 'up' | 'down') => {
    const lines = [...structuredContent.heading_lines];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lines.length) return;
    const temp = lines[index];
    lines[index] = lines[targetIdx];
    lines[targetIdx] = temp;
    setStructuredContent({ ...structuredContent, heading_lines: lines });
  };

  // Feature Items helpers
  const addFeatureItem = () => {
    const newFeature: BannerFeatureItem = {
      id: `f-${Date.now()}`,
      icon: 'shield',
      title: 'FEATURE',
      description: 'Benefit highlight',
    };
    setStructuredContent({
      ...structuredContent,
      features: [...structuredContent.features, newFeature],
    });
  };

  const updateFeatureItem = (index: number, updates: Partial<BannerFeatureItem>) => {
    const feats = [...structuredContent.features];
    feats[index] = { ...feats[index], ...updates };
    setStructuredContent({ ...structuredContent, features: feats });
  };

  const removeFeatureItem = (index: number) => {
    const feats = structuredContent.features.filter((_, i) => i !== index);
    setStructuredContent({ ...structuredContent, features: feats });
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please upload a Desktop Banner Image');
      return;
    }

    const showOverlay = structuredContent.show_overlay !== false;
    if (showOverlay && (!structuredContent.heading_lines.length || !structuredContent.heading_lines[0].text.trim())) {
      alert('Please provide at least one heading line with text, or disable the text overlay');
      return;
    }

    setSubmitting(true);

    const serialized = serializeBannerContent(structuredContent);

    const payload = {
      title: serialized.title,
      subtitle: serialized.subtitle,
      image_url: imageUrl.trim(),
      cloudinary_public_id: cloudinaryPublicId || null,
      mobile_image_url: mobileImageUrl.trim() || null,
      mobile_cloudinary_public_id: mobileCloudinaryPublicId || null,
      button_text: serialized.button_text,
      button_link: serialized.button_link,
      position: position,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
    };

    let error = null;
    if (editingBanner) {
      const res = await supabase.from('banners').update(payload).eq('id', editingBanner.id);
      error = res.error;
    } else {
      const res = await supabase.from('banners').insert(payload);
      error = res.error;
    }

    if (error) {
      alert(`Failed to save banner: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setModalOpen(false);
    await loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    await loadBanners();
  };

  const currentPreviewImage = previewMode === 'mobile' ? (mobileImageUrl || imageUrl) : imageUrl;
  const isOverlayActive = structuredContent.show_overlay !== false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Marketing & Visuals
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Homepage Banners ({banners.length})
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage desktop & mobile responsive banners with interactive typography or pure image graphics.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Banner</span>
        </button>
      </div>

      {/* Banners List Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : banners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4">Banner Images</th>
                  <th className="py-3.5 px-4">Heading Structure / Mode</th>
                  <th className="py-3.5 px-4">Feature Items</th>
                  <th className="py-3.5 px-4">Call To Action</th>
                  <th className="py-3.5 px-4">Order / Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {banners.map((b) => {
                  const content = parseBannerContent(b);
                  const hasOverlay = content.show_overlay !== false;
                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Banner Thumbnails */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {/* Desktop Thumb */}
                          <div className="relative w-24 h-12 rounded-lg bg-neutral-900 border border-neutral-200 overflow-hidden shadow-xs shrink-0">
                            {b.image_url ? (
                              <Image src={b.image_url} alt={b.title || 'Banner'} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">No Img</div>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/70 text-[8px] font-bold text-white rounded">
                              DESK
                            </span>
                          </div>

                          {/* Mobile Thumb (if any) */}
                          {b.mobile_image_url ? (
                            <div className="relative w-9 h-12 rounded-lg bg-neutral-900 border border-neutral-200 overflow-hidden shadow-xs shrink-0">
                              <Image src={b.mobile_image_url} alt="Mobile Banner" fill className="object-cover" />
                              <span className="absolute bottom-0.5 right-0.5 px-0.5 py-0.2 bg-orange-600 text-[7px] font-bold text-white rounded">
                                MOB
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-normal">Auto Mobile</span>
                          )}
                        </div>
                      </td>

                      {/* Heading / Banner Mode */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {hasOverlay ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">
                              <Sparkles size={10} /> Text Overlay Enabled
                            </span>
                            {content.heading_lines.map((line, idx) => (
                              <span
                                key={idx}
                                className="font-black text-xs leading-tight inline-block uppercase text-neutral-900"
                              >
                                {line.text}
                              </span>
                            ))}
                            {content.subtitle && (
                              <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{content.subtitle}</div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold w-max">
                              <ImageIcon size={10} /> Clean Graphic Banner (No Text Overlay)
                            </span>
                            <span className="text-[11px] text-neutral-600 font-semibold">{b.title || 'Hero Banner'}</span>
                          </div>
                        )}
                      </td>

                      {/* Feature Items */}
                      <td className="py-3.5 px-4">
                        {hasOverlay && content.features && content.features.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {content.features.map((f, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-bold text-neutral-800 uppercase"
                              >
                                {f.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Call to Action */}
                      <td className="py-3.5 px-4">
                        {hasOverlay && content.button_visible && content.button_text ? (
                          <div className="font-bold text-orange-600">
                            {content.button_text}{' '}
                            <span className="text-neutral-400 font-normal font-mono text-[11px]">
                              → {content.button_link}
                            </span>
                          </div>
                        ) : content.button_link ? (
                          <div className="text-neutral-600 font-mono text-[11px] flex items-center gap-1">
                            <ExternalLink size={11} className="text-neutral-400" />
                            <span>{content.button_link}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">/shop</span>
                        )}
                      </td>

                      {/* Order & Active Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-700">#{b.sort_order}</span>
                          <span
                            className={`status-pill ${
                              b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {b.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 text-neutral-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Edit Banner"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-neutral-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-neutral-400 text-xs">
            No banners created yet. The storefront will show the default industrial hero slide.
          </div>
        )}
      </div>

      {/* =========================================================================
          Structured Banner Builder Modal with Real-time Live Preview
          ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 text-white rounded-2xl w-full max-w-6xl shadow-2xl border border-neutral-800 my-auto flex flex-col max-h-[94vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-white uppercase tracking-tight leading-none">
                    {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Configure desktop & mobile images, typography overlays, and test responsive preview in real-time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Layout (Editor Left, Live Preview Right) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
              {/* Left Column: Builder Form Tabs */}
              <div className="lg:col-span-6 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 overflow-y-auto space-y-5 bg-neutral-900">
                {/* Master Mode Switcher: Text Overlay vs Clean Graphic */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Banner Display Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStructuredContent({ ...structuredContent, show_overlay: true })}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isOverlayActive
                          ? 'border-orange-500 bg-orange-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Type size={14} className={isOverlayActive ? 'text-orange-500' : 'text-neutral-400'} />
                        <span>Interactive Text Overlay</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                        Headlines, badges, icons, & animated button over photo.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStructuredContent({ ...structuredContent, show_overlay: false })}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        !isOverlayActive
                          ? 'border-orange-500 bg-orange-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ImageIcon size={14} className={!isOverlayActive ? 'text-orange-500' : 'text-neutral-400'} />
                        <span>Clean Graphic Banner</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
                        Pure image artwork only (no text overlay). Entire banner is clickable.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Form Tabs */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  {[
                    { id: 'content', label: 'Headlines', icon: <Type size={14} />, disabled: !isOverlayActive },
                    { id: 'features', label: 'Features', icon: <Layers size={14} />, disabled: !isOverlayActive },
                    { id: 'cta', label: 'CTA & Link', icon: <AlignLeft size={14} />, disabled: false },
                    { id: 'settings', label: 'Images & Setup', icon: <Eye size={14} />, disabled: false },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={tab.disabled}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-orange-500 text-white shadow-md'
                          : tab.disabled
                          ? 'opacity-30 cursor-not-allowed text-neutral-500'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: Headlines & Subtitles */}
                {isOverlayActive && activeTab === 'content' && (
                  <div className="space-y-4 text-xs">
                    {/* Top Tagline Badge */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                          Top Badge / Category Tag (Optional)
                        </label>
                        <div className="flex items-center gap-1">
                          {BANNER_COLOR_PRESETS.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setStructuredContent({ ...structuredContent, badge_color: p.value })}
                              className="w-4 h-4 rounded-full border border-neutral-700 transition-transform hover:scale-125 cursor-pointer"
                              style={{ backgroundColor: p.value }}
                              title={p.label}
                            />
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={structuredContent.badge || ''}
                        onChange={(e) => setStructuredContent({ ...structuredContent, badge: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-orange-500 font-bold"
                        placeholder="e.g. Professional Tools Store"
                      />
                    </div>

                    {/* Multi-line Headings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-white uppercase tracking-wider text-xs">
                            Heading Lines ({structuredContent.heading_lines.length})
                          </span>
                          <p className="text-[10px] text-neutral-400">
                            Each line has independent text, color, size & font weight.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addHeadingLine}
                          className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add Line</span>
                        </button>
                      </div>

                      {structuredContent.heading_lines.map((line, index) => (
                        <div
                          key={line.id}
                          className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                              Line #{index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveHeadingLine(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveHeadingLine(index, 'down')}
                                disabled={index === structuredContent.heading_lines.length - 1}
                                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeHeadingLine(index)}
                                className="p-1 rounded text-neutral-400 hover:text-red-400 ml-1 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Line Text Input */}
                          <input
                            type="text"
                            value={line.text}
                            onChange={(e) => updateHeadingLine(index, { text: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-orange-500 font-black tracking-wide uppercase"
                            placeholder="e.g. BUILT FOR"
                          />

                          {/* Line Style Controls (Color, Size, Weight) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {/* Color Selector */}
                            <div>
                              <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                                Text Color
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={line.color || '#ffffff'}
                                  onChange={(e) => updateHeadingLine(index, { color: e.target.value })}
                                  className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer p-0.5"
                                />
                                <div className="flex items-center gap-1">
                                  {BANNER_COLOR_PRESETS.slice(0, 4).map((p) => (
                                    <button
                                      key={p.value}
                                      type="button"
                                      onClick={() => updateHeadingLine(index, { color: p.value })}
                                      className="w-4 h-4 rounded-full border border-neutral-700 hover:scale-125 transition-transform cursor-pointer"
                                      style={{ backgroundColor: p.value }}
                                      title={p.label}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Size Selector */}
                            <div>
                              <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                                Font Size
                              </span>
                              <select
                                value={line.size}
                                onChange={(e) =>
                                  updateHeadingLine(index, { size: e.target.value as BannerHeadingSize })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                              >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                                <option value="extra-large">Extra Large</option>
                                <option value="massive">Massive (Hero)</option>
                              </select>
                            </div>

                            {/* Weight Selector */}
                            <div>
                              <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                                Font Weight
                              </span>
                              <select
                                value={line.weight}
                                onChange={(e) =>
                                  updateHeadingLine(index, { weight: e.target.value as BannerHeadingWeight })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                              >
                                <option value="normal">Normal (400)</option>
                                <option value="semibold">Semibold (600)</option>
                                <option value="bold">Bold (700)</option>
                                <option value="extrabold">Extra Bold (800)</option>
                                <option value="black">Ultra Black (900)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Subtitle Field */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                          Subtitle / Supporting Line
                        </label>
                        <div className="flex items-center gap-1">
                          {BANNER_COLOR_PRESETS.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setStructuredContent({ ...structuredContent, subtitle_color: p.value })}
                              className="w-4 h-4 rounded-full border border-neutral-700 hover:scale-125 transition-transform cursor-pointer"
                              style={{ backgroundColor: p.value }}
                              title={p.label}
                            />
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={structuredContent.subtitle || ''}
                        onChange={(e) => setStructuredContent({ ...structuredContent, subtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-orange-500"
                        placeholder="e.g. Heavy-duty tools for professionals and tradespeople"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Feature Badges (Sales, Service, Support) */}
                {isOverlayActive && activeTab === 'features' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-white uppercase tracking-wider text-xs">
                          Trust Badges & Feature Pills ({structuredContent.features.length})
                        </span>
                        <p className="text-[10px] text-neutral-400">
                          Highlights shown below subtitle (e.g. Sales, Service, Support).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addFeatureItem}
                        disabled={structuredContent.features.length >= 4}
                        className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Badge</span>
                      </button>
                    </div>

                    {structuredContent.features.map((feat, index) => (
                      <div
                        key={feat.id}
                        className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                            Badge #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFeatureItem(index)}
                            className="p-1 rounded text-neutral-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Icon Selector */}
                          <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Icon</span>
                            <select
                              value={feat.icon}
                              onChange={(e) =>
                                updateFeatureItem(index, { icon: e.target.value as BannerFeatureIcon })
                              }
                              className="w-full px-2 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                            >
                              {BANNER_ICON_OPTIONS.map((ico) => (
                                <option key={ico.value} value={ico.value}>
                                  {ico.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Title */}
                          <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Badge Title
                            </span>
                            <input
                              type="text"
                              value={feat.title}
                              onChange={(e) => updateFeatureItem(index, { title: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-bold uppercase"
                              placeholder="e.g. SALES"
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Sub-label
                            </span>
                            <input
                              type="text"
                              value={feat.description || ''}
                              onChange={(e) => updateFeatureItem(index, { description: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs"
                              placeholder="e.g. Buy with confidence"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: CTA & Positioning */}
                {activeTab === 'cta' && (
                  <div className="space-y-4 text-xs">
                    {/* CTA Configuration */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white uppercase tracking-wider text-xs">
                          Call To Action (Destination Link)
                        </span>
                        {isOverlayActive && (
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-orange-500">
                            <input
                              type="checkbox"
                              checked={structuredContent.button_visible ?? true}
                              onChange={(e) =>
                                setStructuredContent({ ...structuredContent, button_visible: e.target.checked })
                              }
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span>Show Button Overlay</span>
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {isOverlayActive && structuredContent.button_visible !== false && (
                          <div>
                            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={structuredContent.button_text || ''}
                              onChange={(e) =>
                                setStructuredContent({ ...structuredContent, button_text: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-bold uppercase"
                              placeholder="SHOP NOW"
                            />
                          </div>
                        )}

                        <div className={!isOverlayActive || structuredContent.button_visible === false ? 'sm:col-span-2' : ''}>
                          <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                            Destination Link
                          </label>
                          <input
                            type="text"
                            value={structuredContent.button_link || ''}
                            onChange={(e) =>
                              setStructuredContent({ ...structuredContent, button_link: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono"
                            placeholder="/shop or /category/cordless-tools"
                          />
                        </div>

                        {isOverlayActive && structuredContent.button_visible !== false && (
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Button Style
                            </label>
                            <select
                              value={structuredContent.button_style || 'primary'}
                              onChange={(e) =>
                                setStructuredContent({
                                  ...structuredContent,
                                  button_style: e.target.value as BannerButtonStyle,
                                })
                              }
                              className="w-full px-2 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                            >
                              <option value="primary">Brand Orange Button</option>
                              <option value="secondary">Outline White Button</option>
                              <option value="dark">Dark Slate Button</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Positioning Controls (Only relevant if overlay is enabled) */}
                    {isOverlayActive && (
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                        <span className="font-black text-white uppercase tracking-wider text-xs block">
                          Content Positioning Over Background
                        </span>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Horizontal Position */}
                          <div>
                            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">
                              Horizontal Align
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                              {[
                                { val: 'left', label: 'Left' },
                                { val: 'center', label: 'Center' },
                                { val: 'right', label: 'Right' },
                              ].map((pos) => (
                                <button
                                  key={pos.val}
                                  type="button"
                                  onClick={() =>
                                    setStructuredContent({
                                      ...structuredContent,
                                      horizontal_position: pos.val as BannerHorizontalPosition,
                                    })
                                  }
                                  className={`py-2 px-2 rounded font-bold text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                                    structuredContent.horizontal_position === pos.val
                                      ? 'bg-orange-500 text-white shadow-xs'
                                      : 'text-neutral-400 hover:text-white'
                                  }`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Vertical Position */}
                          <div>
                            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">
                              Vertical Align
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                              {[
                                { val: 'top', label: 'Top' },
                                { val: 'center', label: 'Middle' },
                                { val: 'bottom', label: 'Bottom' },
                              ].map((pos) => (
                                <button
                                  key={pos.val}
                                  type="button"
                                  onClick={() =>
                                    setStructuredContent({
                                      ...structuredContent,
                                      vertical_position: pos.val as BannerVerticalPosition,
                                    })
                                  }
                                  className={`py-2 px-2 rounded font-bold text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                                    structuredContent.vertical_position === pos.val
                                      ? 'bg-orange-500 text-white shadow-xs'
                                      : 'text-neutral-400 hover:text-white'
                                  }`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Image & Basic Settings */}
                {activeTab === 'settings' && (
                  <div className="space-y-4 text-xs">
                    {/* 1. Desktop Banner Image */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Monitor size={14} className="text-orange-500" />
                          <span>Desktop Banner Image *</span>
                        </span>
                        <span className="text-[10px] text-neutral-400">1920x800px (16:9 / 21:9)</span>
                      </div>
                      <ImageUploader
                        value={imageUrl}
                        folder="toolsman/banners"
                        onChange={(url, publicId) => {
                          setImageUrl(url);
                          setCloudinaryPublicId(publicId || '');
                        }}
                      />
                    </div>

                    {/* 2. Mobile Banner Image (Optional) */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Smartphone size={14} className="text-orange-500" />
                          <span>Mobile Banner Image (Optional)</span>
                        </span>
                        <span className="text-[10px] text-orange-400 font-medium">800x1000px (4:5 / 9:16)</span>
                      </div>
                      <ImageUploader
                        value={mobileImageUrl}
                        folder="toolsman/banners/mobile"
                        onChange={(url, publicId) => {
                          setMobileImageUrl(url);
                          setMobileCloudinaryPublicId(publicId || '');
                        }}
                      />
                      <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                        💡 If no mobile image is uploaded, the desktop banner will automatically center and adapt on mobile phones.
                      </p>
                    </div>

                    {/* Sort Order & Active */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 font-bold text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span>Active on Storefront</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Real-time Visual Preview */}
              <div className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between bg-neutral-950 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Eye size={15} className="text-orange-500" />
                      <span className="font-bold text-xs uppercase tracking-wider text-white">
                        Live Preview ({previewMode.toUpperCase()})
                      </span>
                    </div>

                    {/* Viewport switch */}
                    <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          previewMode === 'desktop' ? 'bg-orange-500 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Monitor size={12} />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          previewMode === 'mobile' ? 'bg-orange-500 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Smartphone size={12} />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Canvas */}
                  <div
                    className={`mx-auto overflow-hidden relative transition-all duration-300 flex items-center justify-center ${
                      previewMode === 'desktop'
                        ? 'w-full aspect-[16/8] rounded-xl border border-neutral-800 shadow-2xl'
                        : 'max-w-[300px] w-full aspect-[9/16] rounded-3xl border-4 border-neutral-700 shadow-2xl'
                    }`}
                    style={{ backgroundColor: '#0a0a0a' }}
                  >
                    {/* Background Image Layer */}
                    {currentPreviewImage ? (
                      <Image src={currentPreviewImage} alt="Preview Background" fill className="object-cover" />
                    ) : (
                      <div
                        className="w-full h-full opacity-20"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.08) 35px, rgba(255,255,255,.08) 70px)',
                        }}
                      />
                    )}

                    {/* Content Overlay / Graphic Overlay */}
                    {isOverlayActive ? (
                      <>
                        {/* Gradient Overlay for Readability */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              structuredContent.horizontal_position === 'right'
                                ? 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)'
                                : structuredContent.horizontal_position === 'center'
                                ? 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.7) 100%)'
                                : 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.15) 100%)',
                          }}
                        />

                        {/* Content Overlay */}
                        <div
                          className={`absolute inset-0 p-4 sm:p-6 flex ${
                            structuredContent.vertical_position === 'top'
                              ? 'items-start'
                              : structuredContent.vertical_position === 'bottom'
                              ? 'items-end'
                              : 'items-center'
                          }`}
                        >
                          <div className={`w-full ${previewMode === 'mobile' ? 'scale-85 origin-top-left' : 'scale-95 origin-top-left'}`}>
                            <BannerContentView content={structuredContent} isLive={true} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute bottom-3 inset-x-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-lg">
                          <ExternalLink size={12} className="text-orange-400" />
                          <span>Click destination: {structuredContent.button_link || '/shop'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-700 font-bold text-neutral-300 hover:bg-neutral-800 transition-colors text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Banner...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Save & Publish Banner</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
