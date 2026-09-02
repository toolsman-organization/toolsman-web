'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setErrorMsg('Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/login" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 mb-4">
        <ArrowLeft size={14} />
        Back to Sign In
      </Link>

      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
          Reset Your Password
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Enter your email address and we&apos;ll send you a recovery link.
        </p>
      </div>

      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Reset Link Sent!</h2>
          <p className="text-xs text-neutral-600 mb-6">
            If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
          </p>
          <Link href="/login" className="btn-primary w-full py-2.5 text-xs font-bold">
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            <span>SEND RESET INSTRUCTIONS</span>
          </button>
        </form>
      )}
    </div>
  );
}
