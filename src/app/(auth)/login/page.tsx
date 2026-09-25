'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Loader2, AlertCircle, ShieldAlert, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');

  const isAdminMode = redirectTo.startsWith('/admin') || urlError === 'unauthorized_admin' || searchParams.get('admin') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (urlError === 'unauthorized_admin') {
      setErrorMsg('Administrator access required. Please sign in with your admin credentials.');
    }
  }, [urlError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check role to verify admin access
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

        // Email-based admin fallback for toolsman master admin
        if (!isAdmin && data.user.email?.toLowerCase() === 'admin@toolsman.in') {
          isAdmin = true;
          // Auto sync profile role to admin if needed
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              role: 'admin',
              full_name: data.user.user_metadata?.full_name || 'Admin',
            }, { onConflict: 'id' });
          } catch {
            // Ignore
          }
        }

        if (isAdminMode) {
          if (isAdmin) {
            router.push('/admin');
            router.refresh();
          } else {
            setErrorMsg('Access denied: This account does not have administrator privileges.');
            setLoading(false);
            return;
          }
        } else if (isAdmin || redirectTo.startsWith('/admin')) {
          router.push('/admin');
          router.refresh();
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch {
      setErrorMsg('Failed to sign in. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="text-center mb-6">
        {isAdminMode ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold uppercase tracking-widest mb-3 shadow-2xs">
              <ShieldCheck size={14} className="text-orange-600" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Enter your administrative credentials to access the management portal.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Access your orders, wishlist, and customer profile.
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          {urlError === 'unauthorized_admin' || errorMsg.includes('Access denied') ? (
            <ShieldAlert size={18} className="text-orange-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
            {isAdminMode ? 'Admin Email Address' : 'Email Address'}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
            placeholder={isAdminMode ? 'admin@toolsman.in' : 'name@example.com'}
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-neutral-700 uppercase tracking-wider">
              Password
            </label>
            {!isAdminMode && (
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : isAdminMode ? (
            <>
              <Lock size={15} />
              <span>SIGN IN TO ADMIN CONSOLE</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>SIGN IN</span>
            </>
          )}
        </button>
      </form>

      {/* Footer / Links */}
      {isAdminMode ? (
        <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col items-center gap-2 text-center text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 font-medium text-neutral-400">
            <Lock size={12} className="text-neutral-400" />
            Restricted administrative area. Authorized personnel only.
          </span>
          <Link
            href="/"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1 mt-1"
          >
            <ArrowLeft size={13} />
            <span>Back to Storefront</span>
          </Link>
        </div>
      ) : (
        <div className="mt-6 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-600">
          Don&apos;t have an account yet?{' '}
          <Link
            href={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors"
          >
            Register here
          </Link>
        </div>
      )}
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

