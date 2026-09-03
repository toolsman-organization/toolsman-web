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
    setPosition('hero');
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setStructuredContent({
      ...DEFAULT_BANNER_TEMPLATE,
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
    setImageUrl(b.image_url);
    setCloudinaryPublicId(b.cloudinary_public_id || '');
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
    if (!imageUrl) {
      alert('Please upload a banner background image');
      return;
    }

    if (!structuredContent.heading_lines.length || !structuredContent.heading_lines[0].text.trim()) {
      alert('Please provide at least one heading line with text');
      return;
    }

    setSubmitting(true);

    const serialized = serializeBannerContent(structuredContent);

    const payload = {
      title: serialized.title,
      subtitle: serialized.subtitle,
      image_url: imageUrl,
      cloudinary_public_id: cloudinaryPublicId || null,
      button_text: serialized.button_text,
      button_link: serialized.button_link,
      position: position,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
    };

    if (editingBanner) {
      await supabase.from('banners').update(payload).eq('id', editingBanner.id);
    } else {
      await supabase.from('banners').insert(payload);
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
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create New Hero Banner</span>
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
                  <th className="py-3.5 px-4">Preview</th>
                  <th className="py-3.5 px-4">Heading Structure</th>
                  <th className="py-3.5 px-4">Feature Items</th>
                  <th className="py-3.5 px-4">Call To Action</th>
                  <th className="py-3.5 px-4">Order / Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {banners.map((b) => {
                  const content = parseBannerContent(b);
                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="relative w-28 h-14 rounded-lg bg-neutral-900 border border-neutral-200 overflow-hidden shadow-xs">
                          {b.image_url ? (
                            <Image src={b.image_url} alt={b.title || 'Banner'} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-500">No Img</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          {content.heading_lines.map((line, idx) => (
                            <span
                              key={idx}
                              className="font-black text-xs leading-tight inline-block uppercase"
                              style={{ color: line.color || '#111111' }}
                            >
                              {line.text}
                            </span>
                          ))}
                        </div>
                        {content.subtitle && (
                          <div className="text-[11px] text-neutral-500 line-clamp-1 mt-1">{content.subtitle}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {content.features && content.features.length > 0 ? (
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

                      <td className="py-3.5 px-4">
                        {content.button_visible && content.button_text ? (
                          <div className="font-bold text-orange-600">
                            {content.button_text}{' '}
                            <span className="text-neutral-400 font-normal font-mono text-[11px]">
                              → {content.button_link}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">No CTA</span>
                        )}
                      </td>

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

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 text-neutral-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                            title="Edit Banner"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-neutral-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
                    {editingBanner ? 'Edit Banner Builder' : 'New Hero Banner Builder'}
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Configure multi-line headlines, colors, features, CTA and preview in real time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Layout (Editor Left, Live Preview Right) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
              {/* Left Column: Builder Form Tabs */}
              <div className="lg:col-span-6 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 overflow-y-auto space-y-5 bg-neutral-900">
                {/* Form Tabs */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  {[
                    { id: 'content', label: 'Headlines', icon: <Type size={14} /> },
                    { id: 'features', label: 'Features', icon: <Layers size={14} /> },
                    { id: 'cta', label: 'CTA & Position', icon: <AlignLeft size={14} /> },
                    { id: 'settings', label: 'Image & Setup', icon: <Eye size={14} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === tab.id
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: Headlines & Subtitles */}
                {activeTab === 'content' && (
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
                              className="w-4 h-4 rounded-full border border-neutral-700 transition-transform hover:scale-125"
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
                          className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
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
                                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveHeadingLine(index, 'down')}
                                disabled={index === structuredContent.heading_lines.length - 1}
                                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeHeadingLine(index)}
                                className="p-1 rounded text-neutral-400 hover:text-red-400 ml-1"
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
                                      className="w-4 h-4 rounded-full border border-neutral-700 hover:scale-125 transition-transform"
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
                                <option value="small">Small (3xl)</option>
                                <option value="medium">Medium (4xl)</option>
                                <option value="large">Large (5xl-8xl)</option>
                                <option value="extra-large">Extra Large (Hero 8xl+)</option>
                                <option value="massive">Massive (Ultra Hero 10xl+)</option>
                              </select>
                            </div>

                            {/* Weight Selector */}
                            <div>
                              <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                                Weight
                              </span>
                              <select
                                value={line.weight}
                                onChange={(e) =>
                                  updateHeadingLine(index, { weight: e.target.value as BannerHeadingWeight })
                                }
                                className="w-full px-2 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                              >
                                <option value="normal">Normal</option>
                                <option value="semibold">Semi-Bold</option>
                                <option value="bold">Bold</option>
                                <option value="extrabold">Extra Bold</option>
                                <option value="black">Black (Ultra)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Subtitle & Description */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                            Subtitle Text
                          </label>
                          <input
                            type="color"
                            value={structuredContent.subtitle_color || '#d4d4d4'}
                            onChange={(e) =>
                              setStructuredContent({ ...structuredContent, subtitle_color: e.target.value })
                            }
                            className="w-5 h-5 rounded border border-neutral-700 bg-transparent cursor-pointer"
                            title="Subtitle Color"
                          />
                        </div>
                        <input
                          type="text"
                          value={structuredContent.subtitle || ''}
                          onChange={(e) => setStructuredContent({ ...structuredContent, subtitle: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-orange-500 font-medium"
                          placeholder="e.g. Professional tools. Serious performance."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                            Description / Fine Print (Optional)
                          </label>
                          <input
                            type="color"
                            value={structuredContent.description_color || '#a3a3a3'}
                            onChange={(e) =>
                              setStructuredContent({ ...structuredContent, description_color: e.target.value })
                            }
                            className="w-5 h-5 rounded border border-neutral-700 bg-transparent cursor-pointer"
                            title="Description Color"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={structuredContent.description || ''}
                          onChange={(e) =>
                            setStructuredContent({ ...structuredContent, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-orange-500"
                          placeholder="e.g. Authorized supplier with full manufacturer warranty across Kerala."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Feature & Benefit Badges */}
                {activeTab === 'features' && (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-white uppercase tracking-wider text-xs">
                          Feature Badges ({structuredContent.features.length})
                        </span>
                        <p className="text-[10px] text-neutral-400">
                          Highlights like SALES, SERVICE, SUPPORT displayed as visual badges.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addFeatureItem}
                        className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                      >
                        <Plus size={13} />
                        <span>Add Badge</span>
                      </button>
                    </div>

                    {structuredContent.features.map((feat, index) => (
                      <div
                        key={feat.id}
                        className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                            Badge #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFeatureItem(index)}
                            className="p-1 rounded text-neutral-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Icon Selector */}
                          <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Badge Icon
                            </span>
                            <select
                              value={feat.icon}
                              onChange={(e) =>
                                updateFeatureItem(index, { icon: e.target.value as BannerFeatureIcon })
                              }
                              className="w-full px-2 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold focus:outline-none"
                            >
                              {BANNER_ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Title */}
                          <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                              Title
                            </span>
                            <input
                              type="text"
                              value={feat.title}
                              onChange={(e) => updateFeatureItem(index, { title: e.target.value })}
                              className="w-full px-2.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-black uppercase"
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
                          Call To Action (CTA Button)
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-orange-500">
                          <input
                            type="checkbox"
                            checked={structuredContent.button_visible ?? true}
                            onChange={(e) =>
                              setStructuredContent({ ...structuredContent, button_visible: e.target.checked })
                            }
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span>Show Button</span>
                        </label>
                      </div>

                      {structuredContent.button_visible !== false && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

                          <div>
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
                              placeholder="/shop"
                            />
                          </div>

                          <div>
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
                              <option value="primary">Brand Orange</option>
                              <option value="secondary">Outline White</option>
                              <option value="dark">Dark Slate</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Positioning Controls */}
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
                              { val: 'left', icon: <AlignLeft size={14} />, label: 'Left' },
                              { val: 'center', icon: <AlignCenter size={14} />, label: 'Center' },
                              { val: 'right', icon: <AlignRight size={14} />, label: 'Right' },
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
                                className={`py-1.5 px-2 rounded font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                  structuredContent.horizontal_position === pos.val
                                    ? 'bg-orange-500 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                {pos.icon}
                                <span className="text-[9px]">{pos.label}</span>
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
                                className={`py-2 px-2 rounded font-bold text-[10px] flex items-center justify-center transition-all ${
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
                  </div>
                )}

                {/* TAB 4: Image & Basic Settings */}
                {activeTab === 'settings' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <ImageUploader
                        label="Background Image (Upload from Device) *"
                        value={imageUrl}
                        folder="toolsman/banners"
                        onChange={(url, publicId) => {
                          setImageUrl(url);
                          setCloudinaryPublicId(publicId || '');
                        }}
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Recommended size: 1920x800px or wide banner photo with tools on the right.
                      </p>
                    </div>

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
                        Live Storefront Preview
                      </span>
                    </div>

                    {/* Viewport switch */}
                    <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('desktop')}
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                          previewMode === 'desktop' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Monitor size={12} />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('mobile')}
                        className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                          previewMode === 'mobile' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Smartphone size={12} />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Canvas */}
                  <div
                    className={`mx-auto rounded-xl overflow-hidden border border-neutral-800 shadow-2xl relative transition-all duration-300 ${
                      previewMode === 'desktop' ? 'w-full aspect-[16/9]' : 'max-w-xs w-full aspect-[4/5]'
                    }`}
                    style={{ backgroundColor: '#0a0a0a' }}
                  >
                    {/* Background Image Layer */}
                    {imageUrl ? (
                      <Image src={imageUrl} alt="Preview Background" fill className="object-cover" />
                    ) : (
                      <div
                        className="w-full h-full opacity-20"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.08) 35px, rgba(255,255,255,.08) 70px)',
                        }}
                      />
                    )}

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
                      className={`absolute inset-0 p-5 sm:p-7 flex ${
                        structuredContent.vertical_position === 'top'
                          ? 'items-start'
                          : structuredContent.vertical_position === 'bottom'
                          ? 'items-end'
                          : 'items-center'
                      }`}
                    >
                      <div className="w-full scale-90 sm:scale-95 origin-top-left">
                        <BannerContentView content={structuredContent} isLive={true} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-700 font-bold text-neutral-300 hover:bg-neutral-800 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
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
