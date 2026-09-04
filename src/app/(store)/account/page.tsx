import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, Heart, MapPin, User, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUserOrders } from '@/services/orders';
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const orders = await getUserOrders(user.id);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="bg-white min-h-screen py-5 sm:py-10 border-b border-neutral-200">
      <div className="container-site max-w-5xl">
        {/* Welcome Header */}
        <div className="bg-neutral-900 text-white rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-orange-500 text-white font-black text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                Toolsman Member Account
              </span>
              <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {profile?.full_name || user.email?.split('@')[0]}
              </h1>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-5 sm:mb-8">
          <Link
            href="/account/orders"
            className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-orange-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 rounded-lg bg-orange-50 text-orange-600">
                <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">My Orders</h3>
                <p className="text-xs text-neutral-500">{orders.length} total orders placed</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/account/wishlist"
            className="p-5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-orange-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-50 text-red-500">
                <Heart size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Wishlist</h3>
                <p className="text-xs text-neutral-500">Saved tools & gear</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/account/addresses"
            className="p-5 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-orange-500 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Addresses</h3>
                <p className="text-xs text-neutral-500">Delivery addresses in Kerala</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100">
            <h2 className="font-black text-lg text-neutral-950 uppercase tracking-tight">
              Recent Orders
            </h2>
            <Link href="/account/orders" className="text-xs font-bold text-orange-600 hover:underline">
              View All Orders
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-900">{order.order_number}</span>
                      <span className={`status-pill ${getOrderStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Placed on {formatDate(order.created_at)} • {formatCurrency(order.total_amount)}
                    </p>
                  </div>

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="btn-secondary py-1.5 px-4 text-xs font-bold"
                  >
                    Order Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs sm:text-sm">
              You haven&apos;t placed any orders yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
