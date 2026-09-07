'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, Store, Truck, Bell, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { SiteSettings } from '@/types/database';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: 'TOOLSMAN',
    store_tagline: 'Built for the Job. Professional Tools. Serious Performance.',
    store_phone: '+91 79944 10167',
    store_email: 'info@toolsman.in',
    store_address: 'Tirur, Puthanathani, Malappuram, Kerala - 676552',
    delivery_base_charge: '100',
    delivery_additional_kg_charge: '50',
    shipping_charge: '100',
    cod_enabled: 'true',
    currency_symbol: '₹',
    currency_code: 'INR',
    meta_title: 'TOOLSMAN — Professional Power Tools',
    meta_description: 'Buy genuine power tools at TOOLSMAN. Fast delivery across Kerala.',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    whatsapp_number: '+917994410167',
  });

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const map: Record<string, string> = { ...settings };
          data.forEach((row: { setting_key: string; setting_value: string }) => {
            map[row.setting_key] = row.setting_value || '';
          });
          setSettings(map);
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const updates = Object.entries(settings).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value,
      }));

      for (const item of updates) {
        await supabase
          .from('site_settings')
          .upsert(item, { onConflict: 'setting_key' });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Configuration & Rules
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Store Settings
          </h1>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2 shadow-md shadow-orange-500/25 self-start sm:self-auto"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? 'Saved Successfully!' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* 1. General Store Details */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 font-bold text-sm text-neutral-900 uppercase tracking-wider">
          <Store size={18} className="text-orange-600" />
          <span>General Store Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => handleChange('store_name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Support Phone (Kerala)
            </label>
            <input
              type="text"
              value={settings.store_phone}
              onChange={(e) => handleChange('store_phone', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={settings.store_email}
              onChange={(e) => handleChange('store_email', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Tagline / Mission Statement
            </label>
            <input
              type="text"
              value={settings.store_tagline}
              onChange={(e) => handleChange('store_tagline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Physical Showroom / Hub Address
            </label>
            <input
              type="text"
              value={settings.store_address}
              onChange={(e) => handleChange('store_address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Shipping & Checkout Rules */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 font-bold text-sm text-neutral-900 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-orange-600" />
            <span>Shipping & Logistics Rules (Weight-Based)</span>
          </div>
          <a
            href="/admin/delivery-charge"
            className="text-xs text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2"
          >
            Open Calculator & Simulator →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Base Delivery Charge — 1 KG (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={settings.delivery_base_charge || '100'}
              onChange={(e) => {
                handleChange('delivery_base_charge', e.target.value);
                handleChange('shipping_charge', e.target.value);
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
              placeholder="100"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">Charge for the first 1 KG</span>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Additional 1 KG Charge (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={settings.delivery_additional_kg_charge || '50'}
              onChange={(e) => handleChange('delivery_additional_kg_charge', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 font-bold focus:outline-none focus:border-orange-500"
              placeholder="50"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">Charge per additional whole KG</span>
          </div>

          <div className="flex items-center pb-1">
            <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cod_enabled === 'true'}
                onChange={(e) => handleChange('cod_enabled', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span>Enable Cash on Delivery (COD)</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. SEO & Meta Details */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100 font-bold text-sm text-neutral-900 uppercase tracking-wider">
          <Globe size={18} className="text-orange-600" />
          <span>SEO & Search Engine Settings</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Homepage Meta Title
            </label>
            <input
              type="text"
              value={settings.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={settings.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
