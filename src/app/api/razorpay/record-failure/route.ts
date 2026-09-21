import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { orderId, errorDescription } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .maybeSingle();

    if (order && order.payment_status !== 'paid') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          order_status: 'awaiting_payment',
          notes: errorDescription || 'Customer payment failed at checkout',
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Record Failure API] Error:', err);
    return NextResponse.json({ error: 'Failed to record failure state' }, { status: 500 });
  }
}
