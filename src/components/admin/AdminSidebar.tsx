'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Tag,
  ShoppingBag,
  Users,
  Image as ImageIcon,
  Megaphone,
  TicketPercent,
  Settings,
  ExternalLink,
  LogOut,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/products', label: 'All Products', icon: <Package size={18} /> },
  { href: '/admin/products/new', label: 'Add Product', icon: <PlusCircle size={18} /> },
  { href: '/admin/categories', label: 'Categories', icon: <FolderTree size={18} /> },
  { href: '/admin/brands', label: 'Brands', icon: <Tag size={18} /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
  { href: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
  { href: '/admin/banners', label: 'Hero Banners', icon: <ImageIcon size={18} /> },
  { href: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { href: '/admin/coupons', label: 'Coupons', icon: <TicketPercent size={18} /> },
  { href: '/admin/settings', label: 'Site Settings', icon: <Settings size={18} /> },
];

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const content = (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-300 border-r border-neutral-800">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center p-1">
            <Image src="/logo.svg" alt="TOOLSMAN" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <span className="text-white font-black text-base tracking-wider block leading-none">
              TOOLSMAN
            </span>
            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">
              ADMIN CONTROL
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-neutral-400 hover:text-white p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-neutral-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Storefront link */}
      <div className="p-3 border-t border-neutral-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <span>View Storefront</span>
          <ExternalLink size={14} />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-64 z-50 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
