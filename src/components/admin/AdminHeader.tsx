'use client';

import { useState } from 'react';
import { Menu, Bell, Shield, Search } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  userEmail?: string | null;
}

export default function AdminHeader({ onMenuToggle, userEmail }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Shield size={16} className="text-orange-600" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-800 hidden sm:inline">
            Admin Management Console
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-black text-xs flex items-center justify-center">
            {userEmail?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-neutral-900 leading-none">
              {userEmail || 'Admin'}
            </div>
            <span className="text-[10px] text-orange-600 font-extrabold uppercase">
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
