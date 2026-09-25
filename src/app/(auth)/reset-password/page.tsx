'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      try {
        // 1. Check if hash fragment contains access_token (Implicit Recovery Flow)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const error = hashParams.get('error_description') || hashParams.get('error');

          if (error) {
            setErrorMsg(decodeURIComponent(error));
            setIsVerifying(false);
            return;
          }

          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (!sessionError) {
              setIsSessionValid(true);
              setIsVerifying(false);
              return;
            }
          }
        }

        // 2. Check if PKCE code parameter is in URL query
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError) {
            setIsSessionValid(true);
            setIsVerifying(false);
            return;
          }
        }

        // 3. Check current session in cookie/storage
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsSessionValid(true);
          setIsVerifying(false);
          return;
        }

        // Brief delay for auth state sync
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          setIsSessionValid(Boolean(retrySession));
          setIsVerifying(false);
        }, 600);
      } catch (err) {
        console.error('[Reset Password] Session check error:', err);
        setIsVerifying(false);
      }
    };

    initAuth();

    // Listen for auth state changes (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        setIsSessionValid(true);
        setIsVerifying(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();

      // Ensure session is recognized from hash if present
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
        }
      }

      // Update password directly with Supabase client
      const { error: clientError } = await supabase.auth.updateUser({ password });

      if (!clientError) {
        setSuccess(true);
        return;
      }

      // Fallback: try server endpoint if client-side reported missing session
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        console.error('[Reset Password] Update error:', clientError);
        setErrorMsg(
          clientError.message ||
          data.error ||
          'Reset link expired or invalid. Please request a new link.'
        );
      }
    } catch {
      setErrorMsg('Failed to update password. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
          <KeyRound size={22} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
          Set New Password
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Choose a secure new password for your TOOLSMAN account.
        </p>
      </div>

      {isVerifying ? (
        <div className="py-10 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-orange-500" />
          <span>Connecting secure session...</span>
        </div>
      ) : success ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Password Changed!</h2>
          <p className="text-xs text-neutral-600 mb-6">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <Link href="/login" className="btn-primary w-full py-3 text-xs font-bold inline-block text-center shadow-lg shadow-orange-500/25">
            Sign In with New Password
          </Link>
        </div>
      ) : (
        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span>{errorMsg}</span>
                {errorMsg.toLowerCase().includes('session') || errorMsg.toLowerCase().includes('expired') ? (
                  <div className="mt-1.5">
                    <Link href="/forgot-password" className="text-orange-600 underline font-bold">
                      Click here to request a new reset link
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {!isSessionValid && !errorMsg && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-3">
              If your link has expired or was already used, please enter your new password below or{' '}
              <Link href="/forgot-password" className="font-bold underline">
                request a new reset link
              </Link>.
            </div>
          )}

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            <span>UPDATE PASSWORD</span>
          </button>
        </form>
      )}
    </div>
  );
}
