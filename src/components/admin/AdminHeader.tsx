import Image from 'next/image';
import Link from 'next/link';
import { Menu, Shield } from 'lucide-react';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  userEmail?: string | null;
}

export default function AdminHeader({ onMenuToggle, userEmail }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Logo on mobile, Console title on desktop */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand Logo */}
        <Link href="/admin" className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 relative shrink-0">
            <Image 
              src="/logo.png" 
              alt="TOOLSMAN" 
              width={28} 
              height={28} 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-neutral-900 leading-tight">
              TOOLSMAN
            </span>
            <span className="text-[8px] font-bold text-orange-600 uppercase tracking-widest leading-none">
              ADMIN
            </span>
          </div>
        </Link>

        {/* Desktop Title */}
        <div className="hidden lg:flex items-center gap-2">
          <Shield size={16} className="text-orange-600" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
            Admin Management Console
          </span>
        </div>
      </div>

      {/* Right side: User Info + Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
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

        {/* Mobile Menu Button on Right */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
