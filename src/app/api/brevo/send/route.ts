import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderDeliveredEmail, isValidEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, orderId, newStatus } = body;

    // Only process order delivered event
    if (type === 'order_delivered' || newStatus === 'delivered') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
      }

      // Fetch authoritative order details from database
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.warn('[Brevo] Order not found for delivery email:', orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Delegate directly to sendOrderDeliveredEmail which handles customer email detection safely
      await sendOrderDeliveredEmail(order);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Brevo Route] Error handling email send request:', err);
    // Return 200/500 without crashing admin flow
    return NextResponse.json({ success: false, error: 'Failed to dispatch email' }, { status: 500 });
  }
}

