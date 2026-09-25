'use client';

import { useState, useEffect } from 'react';
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
  Truck,
  Users,
  Image as ImageIcon,
  Megaphone,
  MessageSquareQuote,
  Settings,
  ExternalLink,
  LogOut,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'Catalog & Inventory',
    items: [
      { href: '/admin/products', label: 'Products', icon: <Package size={18} /> },
      { href: '/admin/categories', label: 'Categories', icon: <FolderTree size={18} /> },
      { href: '/admin/brands', label: 'Brands', icon: <Tag size={18} /> },
    ],
  },
  {
    title: 'Sales & Delivery',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
      { href: '/admin/delivery-charge', label: 'Delivery Charge', icon: <Truck size={18} /> },
      { href: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'Marketing & Content',
    items: [
      { href: '/admin/banners', label: 'Hero Banners', icon: <ImageIcon size={18} /> },
      { href: '/admin/promo-banners', label: 'Promo Banners', icon: <Sparkles size={18} /> },
      { href: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
      { href: '/admin/testimonials', label: 'Testimonials', icon: <MessageSquareQuote size={18} /> },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/admin/settings', label: 'Site Settings', icon: <Settings size={18} /> },
    ],
  },
];

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [latestOrderTimestamp, setLatestOrderTimestamp] = useState<string | null>(null);

  // 1. Initial one-time check on mount & Realtime subscription for instant new orders
  useEffect(() => {
    const supabase = createClient();

    // Initial one-time check for latest order
    const checkInitialOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data?.created_at) return;

        setLatestOrderTimestamp(data.created_at);
        const lastSeen = localStorage.getItem('admin_last_seen_order_time');

        if (pathname.startsWith('/admin/orders')) {
          localStorage.setItem('admin_last_seen_order_time', data.created_at);
          setHasNewOrders(false);
          return;
        }

        if (!lastSeen) {
          localStorage.setItem('admin_last_seen_order_time', data.created_at);
          setHasNewOrders(false);
        } else {
          const lastSeenDate = new Date(lastSeen).getTime();
          const latestOrderDate = new Date(data.created_at).getTime();
          if (latestOrderDate > lastSeenDate) {
            setHasNewOrders(true);
          } else {
            setHasNewOrders(false);
          }
        }
      } catch (err) {
        console.warn('[AdminSidebar] Initial order check note:', err);
      }
    };

    checkInitialOrder();

    // Subscribe to Supabase Realtime INSERT events on public.orders
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as { created_at?: string };
          const createdAt = newOrder?.created_at || new Date().toISOString();
          setLatestOrderTimestamp(createdAt);

          // If admin is currently on the orders page, mark as seen immediately
          if (pathname.startsWith('/admin/orders')) {
            localStorage.setItem('admin_last_seen_order_time', createdAt);
            setHasNewOrders(false);
          } else {
            setHasNewOrders(true);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Admin orders channel error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  // 2. When admin navigates to /admin/orders or /admin/orders/[id], dismiss the red dot
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      if (latestOrderTimestamp) {
        localStorage.setItem('admin_last_seen_order_time', latestOrderTimestamp);
      } else {
        localStorage.setItem('admin_last_seen_order_time', new Date().toISOString());
      }
      setHasNewOrders(false);
    }
  }, [pathname, latestOrderTimestamp]);

  // Lock background body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-300 border-r border-neutral-800 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-800 shrink-0">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="TOOLSMAN" width={40} height={40} className="w-full h-full object-contain" />
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
          <button 
            onClick={onClose} 
            className="lg:hidden text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav List with Section Headings */}
      <nav className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3 pt-1 pb-1">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);

                const isOrdersItem = item.href === '/admin/orders';
                const showRedDot = isOrdersItem && hasNewOrders;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isOrdersItem) {
                        if (latestOrderTimestamp) {
                          localStorage.setItem('admin_last_seen_order_time', latestOrderTimestamp);
                        } else {
                          localStorage.setItem('admin_last_seen_order_time', new Date().toISOString());
                        }
                        setHasNewOrders(false);
                      }
                      if (onClose) onClose();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-neutral-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {showRedDot && (
                      <span className="relative flex h-2.5 w-2.5 shrink-0" title="New order received">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-sm shadow-red-500"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
          onClick={() => {
            if (onClose) onClose();
            setShowLogoutModal(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
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

      {/* Mobile Drawer on Right Side */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
            onClick={onClose} 
          />
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] z-50 shadow-2xl animate-in slide-in-from-right duration-300">
            {content}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <LogOut size={22} />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Sign Out of Admin?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Are you sure you want to end your session? You will need to sign in again to access the admin dashboard.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <span>Yes, Sign Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

