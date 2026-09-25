'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Automatically sign in the user immediately without requiring email verification
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // If automatic sign in has any issue, redirect to login page with email prefilled
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        router.refresh();
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setErrorMsg('Failed to create account. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
          Create Toolsman Account
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Join Kerala&apos;s leading power tools community.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
            placeholder="e.g. Firoz P"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
            placeholder="+91 79944 10167"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Email Address *
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

        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Password *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/25 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>CREATE ACCOUNT</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-600">
        Already have an account?{' '}
        <Link
          href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
