'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (urlError === 'unauthorized_admin') {
      setErrorMsg('Administrator access required. Please sign in with your admin account.');
    }
  }, [urlError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check role to redirect admin to /admin
        let isAdmin = data.user.app_metadata?.role === 'admin' || data.user.user_metadata?.role === 'admin';

        if (!isAdmin) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'admin') {
            isAdmin = true;
          }
        }

        if (isAdmin || redirectTo.startsWith('/admin')) {
          router.push('/admin');
        } else {
          router.push(redirectTo);
        }
        router.refresh();
      }
    } catch {
      setErrorMsg('Failed to sign in. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Access your orders, wishlist, and admin console.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold flex items-center gap-2">
          {urlError === 'unauthorized_admin' ? (
            <ShieldAlert size={18} className="text-orange-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
            placeholder="admin@toolsman.in"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-neutral-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
            placeholder="••••••••"
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
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>SIGN IN</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-600">
        Don&apos;t have an account yet?{' '}
        <Link
          href={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
        >
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
