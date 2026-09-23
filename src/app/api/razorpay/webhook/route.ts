import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { sendPaidOrderEmails } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // 1. Verify Webhook Signature
    try {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } catch (sigErr) {
      console.error('[Razorpay Webhook] Signature verification error:', sigErr);
      return NextResponse.json({ error: 'Signature verification configuration error' }, { status: 400 });
    }

    // 2. Parse Event Payload
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    const supabase = await createClient();

    // 3. Process Events Idempotently
    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const internalOrderId = paymentEntity?.notes?.order_id || orderEntity?.notes?.order_id;

      if (razorpayOrderId || internalOrderId) {
        // Query order by razorpay_order_id or internal id
        let query = supabase.from('orders').select('*, order_items(*)');
        if (internalOrderId) {
          query = query.eq('id', internalOrderId);
        } else {
          query = query.eq('razorpay_order_id', razorpayOrderId);
        }

        const { data: order, error } = await query.maybeSingle();

        if (!error && order) {
          // Idempotency: Never downgrade or re-process if already paid
          if (order.payment_status !== 'paid') {
            const { data: updatedOrder } = await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                order_status: 'confirmed',
                razorpay_payment_id: razorpayPaymentId || order.razorpay_payment_id,
                notes: null,
              })
              .eq('id', order.id)
              .select('*, order_items(*)')
              .single();

            // Send paid order notifications (Customer confirmation + Admin alert)
            if (updatedOrder) {
              await sendPaidOrderEmails(updatedOrder);
            }
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const internalOrderId = paymentEntity?.notes?.order_id;
      const failureReason = paymentEntity?.error_description || paymentEntity?.error_reason || 'Payment failed on Razorpay';

      if (razorpayOrderId || internalOrderId) {
        let query = supabase.from('orders').select('id, payment_status');
        if (internalOrderId) {
          query = query.eq('id', internalOrderId);
        } else {
          query = query.eq('razorpay_order_id', razorpayOrderId);
        }

        const { data: order } = await query.maybeSingle();

        // Only mark failed if NOT already paid
        if (order && order.payment_status !== 'paid') {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              order_status: 'awaiting_payment',
              notes: failureReason,
            })
            .eq('id', order.id);
        }
      }
    } else if (eventType === 'refund.processed' || eventType === 'refund.created') {
      const refundEntity = payload?.refund?.entity;
      const paymentEntity = payload?.payment?.entity;
      const razorpayPaymentId = refundEntity?.payment_id || paymentEntity?.id;

      if (razorpayPaymentId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            notes: `Refund processed (ID: ${refundEntity?.id || 'Razorpay'})`,
          })
          .eq('razorpay_payment_id', razorpayPaymentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('[Razorpay Webhook] Internal error:', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
