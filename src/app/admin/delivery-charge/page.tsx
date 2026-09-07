'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, Truck, Scale, Info, Calculator } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateDeliveryCharge } from '@/lib/delivery';
import { formatCurrency } from '@/lib/utils';

export default function AdminDeliveryChargePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [baseCharge, setBaseCharge] = useState('100');
  const [additionalCharge, setAdditionalCharge] = useState('50');

  // Simulator state
  const [testWeightInput, setTestWeightInput] = useState('2.4');

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['delivery_base_charge', 'delivery_additional_kg_charge', 'shipping_charge'])
      .then(({ data, error }) => {
        if (!error && data) {
          data.forEach((row) => {
            if (row.setting_key === 'delivery_base_charge' && row.setting_value) {
              setBaseCharge(row.setting_value);
            } else if (row.setting_key === 'delivery_additional_kg_charge' && row.setting_value) {
              setAdditionalCharge(row.setting_value);
            } else if (row.setting_key === 'shipping_charge' && row.setting_value && !baseCharge) {
              setBaseCharge(row.setting_value);
            }
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const baseVal = parseFloat(baseCharge);
    const addVal = parseFloat(additionalCharge);

    if (isNaN(baseVal) || baseVal < 0) {
      setErrorMsg('Base Delivery Charge must be a valid positive number or 0.');
      return;
    }

    if (isNaN(addVal) || addVal < 0) {
      setErrorMsg('Additional 1 KG Charge must be a valid positive number or 0.');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const updates = [
        { setting_key: 'delivery_base_charge', setting_value: String(baseVal) },
        { setting_key: 'delivery_additional_kg_charge', setting_value: String(addVal) },
        // Keep legacy shipping_charge in sync for backward-compat
        { setting_key: 'shipping_charge', setting_value: String(baseVal) },
      ];

      for (const item of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(item, { onConflict: 'setting_key' });
        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save delivery charge settings.');
    } finally {
      setSaving(false);
    }
  };

  // Live simulation calculation
  const parsedTestWeight = Math.max(0, parseFloat(testWeightInput) || 0);
  const simResult = calculateDeliveryCharge(
    parsedTestWeight,
    parseFloat(baseCharge) || 0,
    parseFloat(additionalCharge) || 0
  );

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        <p className="text-xs text-neutral-400 mt-2 font-medium">Loading delivery settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Logistics & Pricing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Delivery Charge
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Configure your store&apos;s delivery pricing based on actual product weights.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin text-orange-500" />
              <span>Saving...</span>
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Delivery charge pricing has been updated successfully and is now live on checkout.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Pricing Rules Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-neutral-100 font-bold text-sm text-neutral-900 uppercase tracking-wider">
            <Truck size={18} className="text-orange-600" />
            <span>Weight-Based Pricing Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Field A: Base Delivery Charge */}
            <div className="bg-neutral-50/80 rounded-xl p-5 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-black text-neutral-900 text-sm uppercase tracking-wide">
                  Base Delivery Charge (1 KG) <span className="text-orange-600">*</span>
                </label>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full uppercase">
                  First 1 KG
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={baseCharge}
                  onChange={(e) => setBaseCharge(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-neutral-300 bg-white font-black text-base text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-2xs"
                  placeholder="100"
                />
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                This is the delivery charge for the first <strong>1 KG</strong> of total cart weight.
              </p>
            </div>

            {/* Field B: Additional 1 KG Charge */}
            <div className="bg-neutral-50/80 rounded-xl p-5 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-black text-neutral-900 text-sm uppercase tracking-wide">
                  Additional 1 KG Charge <span className="text-orange-600">*</span>
                </label>
                <span className="text-[10px] font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full uppercase">
                  Per extra KG
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-neutral-300 bg-white font-black text-base text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 shadow-2xs"
                  placeholder="50"
                />
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                This is the additional delivery charge applied for <strong>every additional 1 KG</strong> above the first 1 KG.
              </p>
            </div>
          </div>
        </div>

        {/* Live Calculation Simulator */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-neutral-100 font-bold text-sm text-neutral-900 uppercase tracking-wider">
            <Calculator size={18} className="text-orange-600" />
            <span>Live Calculation Preview & Simulator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-3">
              <label className="block font-bold text-neutral-700 text-xs uppercase tracking-wider">
                Enter Sample Cart Weight (KG):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={testWeightInput}
                  onChange={(e) => setTestWeightInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-none focus:border-orange-500"
                  placeholder="e.g. 2.4"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  KG
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['0.5', '1.0', '1.2', '2.0', '2.5', '4.0'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTestWeightInput(preset)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                  >
                    {preset} KG
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Output Result Box */}
            <div className="md:col-span-7 bg-neutral-950 text-white rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                <span>Weight Calculation Breakdown</span>
                <Scale size={15} className="text-orange-500" />
              </div>

              <div className="space-y-2 text-xs mt-3.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Cart Weight:</span>
                  <span className="font-mono font-bold">{simResult.totalWeightKg} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Chargeable Weight (Ceiling):</span>
                  <span className="font-mono font-bold text-orange-400">{simResult.chargeableWeightKg} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Formula Breakdown:</span>
                  <span className="font-mono text-[11px] text-neutral-300">
                    {simResult.chargeableWeightKg <= 1
                      ? `₹${simResult.baseDeliveryCharge} (Base)`
                      : `₹${simResult.baseDeliveryCharge} + (${simResult.chargeableWeightKg - 1} × ₹${simResult.additional1KgCharge})`}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-neutral-800 flex justify-between items-baseline font-black text-sm">
                  <span className="text-neutral-200 uppercase tracking-wider">Calculated Delivery Fee:</span>
                  <span className="text-lg font-mono text-orange-500">{formatCurrency(simResult.deliveryCharge)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rule Summary Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-800">
            <Info size={14} className="text-amber-600 shrink-0" />
            <span>How the System Applies Weight-Based Charges</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-950/80 leading-relaxed">
            <li><strong>Empty cart</strong>: Delivery charge is ₹0.</li>
            <li><strong>Up to 1.0 KG</strong>: The Base Delivery Charge (₹{baseCharge || 0}) is applied.</li>
            <li><strong>Above 1.0 KG</strong>: The total weight is rounded up to the next whole KG (e.g. 1.2 KG becomes 2 KG chargeable weight) and each additional KG is billed at ₹{additionalCharge || 0}/KG.</li>
            <li><strong>Multiple Products & Quantities</strong>: Item weights are multiplied by their respective quantities and summed before applying the formula.</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
