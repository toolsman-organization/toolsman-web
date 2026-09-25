import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sendPaidOrderEmails } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature required)' },
        { status: 400 }
      );
    }

    const serverSupabase = await createClient();
    let supabase = serverSupabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        supabase = createAdminClient() as any;
      } catch {
        supabase = serverSupabase;
      }
    }

    // 1. Fetch existing order to check status and prevent duplicate updates (Idempotency)
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is already verified and paid, return success idempotently
    if (existingOrder.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        orderNumber: existingOrder.order_number,
        alreadyProcessed: true,
      });
    }

    // 2. Authoritatively verify HMAC SHA256 signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      // Mark payment failed without confirming fulfillment
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          order_status: 'awaiting_payment',
          notes: 'Payment signature verification failed',
        })
        .eq('id', orderId);

      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 3. Mark payment as PAID and fulfillment as CONFIRMED
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id,
        razorpay_signature,
        notes: null,
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (updateError || !updatedOrder) {
      console.error('Failed to update verified order in DB:', updateError);
      return NextResponse.json({ error: 'Failed to update order state' }, { status: 500 });
    }

    // 4. Send paid order notifications (Customer confirmation + Admin alert)
    // Awaiting ensures the serverless/Node environment delivers both emails to Brevo before closing the request
    await sendPaidOrderEmails(updatedOrder);

    // 5. Clear the customer's cart
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      orderNumber: updatedOrder.order_number,
    });
  } catch (err) {
    console.error('Razorpay verification route error:', err);
    return NextResponse.json({ error: 'Server error processing payment verification' }, { status: 500 });
  }
}

