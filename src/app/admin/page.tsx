import Link from 'next/link';
import {
  ShoppingBag,
  IndianRupee,
  Package,
  Users,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { getDashboardStats, getRecentOrders } from '@/services/orders';
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(6),
  ]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <IndianRupee size={22} className="text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: <ShoppingBag size={22} className="text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Active Products',
      value: stats.totalProducts.toString(),
      icon: <Package size={22} className="text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: <Users size={22} className="text-orange-600" />,
      bg: 'bg-orange-50 border-orange-200',
    },
  ];

  const operationalCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <Clock size={18} className="text-amber-600" />,
      color: 'text-amber-700',
      href: '/admin/orders?status=pending',
    },
    {
      title: 'Processing / In-Transit',
      value: stats.processingOrders,
      icon: <Truck size={18} className="text-indigo-600" />,
      color: 'text-indigo-700',
      href: '/admin/orders?status=processing',
    },
    {
      title: 'Delivered Orders',
      value: stats.deliveredOrders,
      icon: <CheckCircle2 size={18} className="text-emerald-600" />,
      color: 'text-emerald-700',
      href: '/admin/orders?status=delivered',
    },
    {
      title: 'Low Stock Alert (<5)',
      value: stats.lowStockProducts,
      icon: <AlertTriangle size={18} className="text-red-600" />,
      color: 'text-red-700',
      href: '/admin/products',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Overview & Metrics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle size={16} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border bg-white shadow-xs flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                {c.title}
              </span>
              <span className="text-2xl font-black text-neutral-950 mt-1 block">
                {c.value}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${c.bg}`}>
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {operationalCards.map((c, i) => (
          <Link
            key={i}
            href={c.href}
            className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-xs hover:border-orange-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500">{c.title}</span>
              {c.icon}
            </div>
            <span className={`text-xl font-black ${c.color}`}>{c.value}</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="font-black text-base text-neutral-950 uppercase tracking-tight">
              Recent Customer Orders
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live orders submitted across Kerala
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{order.customer_name}</div>
                      <div className="text-[11px] text-neutral-400">{order.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-950">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-[11px] text-neutral-700">
                        {order.payment_method} ({order.payment_status})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-pill ${getOrderStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-orange-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400 text-xs">
            No orders placed yet.
          </div>
        )}
      </div>
    </div>
  );
}
