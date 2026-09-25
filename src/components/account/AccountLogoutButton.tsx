'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AccountLogoutButtonProps {
  variant?: 'banner' | 'simple';
  className?: string;
}

export default function AccountLogoutButton({
  variant = 'banner',
  className = '',
}: AccountLogoutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Force a full refresh & navigation to login to clear all cached auth states
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-600/90 text-neutral-200 hover:text-white border border-white/10 hover:border-red-500/50 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto ${className}`}
          title="Sign out of your account"
        >
          <LogOut size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
          <span>Sign Out</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 text-neutral-600 hover:text-red-600 font-medium text-sm transition-colors cursor-pointer ${className}`}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isLoggingOut && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-100 transform transition-all text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <LogOut size={22} />
            </div>

            <h3 className="text-lg font-bold text-center text-neutral-900 mb-1">
              Sign Out
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 text-center mb-6">
              Are you sure you want to sign out of your Toolsman account?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowConfirm(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-xs sm:text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <span>Sign Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
