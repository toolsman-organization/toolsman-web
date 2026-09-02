import { createClient } from '@/lib/supabase/server';
import type { Order, OrderWithItems, OrderStatusHistory } from '@/types/database';

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      status_history:order_status_history(* ORDER BY created_at ASC)
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      status_history:order_status_history(* ORDER BY created_at ASC)
    `)
    .eq('order_number', orderNumber)
    .single();

  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('[Orders] getUserOrders:', error); return []; }
  return (data ?? []) as Order[];
}

export async function getAllOrdersAdmin(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();
  const { page = 1, limit = 20, status, search } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' });

  if (status) query = query.eq('order_status', status);
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { console.error('[Orders] getAllOrdersAdmin:', error); }
  return { data: (data ?? []) as Order[], total: count ?? 0 };
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const [ordersResult, revenueResult, productsResult, customersResult, lowStockResult] =
    await Promise.all([
      supabase.from('orders').select('order_status, payment_status', { count: 'exact' }),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
      supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
      supabase.from('products').select('id', { count: 'exact' }).lt('stock_quantity', 5).eq('is_active', true),
    ]);

  const orders = ordersResult.data ?? [];
  const totalRevenue = (revenueResult.data ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  return {
    totalOrders: ordersResult.count ?? 0,
    totalRevenue,
    totalProducts: productsResult.count ?? 0,
    totalCustomers: customersResult.count ?? 0,
    pendingOrders: orders.filter((o) => o.order_status === 'pending').length,
    processingOrders: orders.filter((o) => ['confirmed', 'processing', 'packed', 'shipped'].includes(o.order_status)).length,
    deliveredOrders: orders.filter((o) => o.order_status === 'delivered').length,
    lowStockProducts: lowStockResult.count ?? 0,
  };
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Order[];
}
