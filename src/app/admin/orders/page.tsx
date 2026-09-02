import Link from 'next/link';
import { Search, Filter, ShoppingBag, Eye } from 'lucide-react';
import { getAllOrdersAdmin } from '@/services/orders';
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';

interface AdminOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

const statusOptions = [
  'all', 'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'
];

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const status = params.status && params.status !== 'all' ? params.status : undefined;
  const search = params.search;

  const { data: orders, total } = await getAllOrdersAdmin({ page, limit: 20, status, search });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Fulfillment & Sales
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Order Management ({total})
          </h1>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {statusOptions.map((s) => {
          const isSelected = (params.status || 'all') === s;
          return (
            <Link
              key={s}
              href={`/admin/orders${s !== 'all' ? `?status=${s}` : ''}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors capitalize ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{order.customer_name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{order.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-neutral-950">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-[10px] uppercase text-neutral-700">
                          {order.payment_method}
                        </span>
                        <span className={`status-pill ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-pill ${getOrderStatusColor(order.order_status)} font-bold`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No orders found in this view.
          </div>
        )}
      </div>
    </div>
  );
}
