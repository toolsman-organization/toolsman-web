import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sendOrderConfirmation } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!orderId || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment verification details' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify signature if secret is provided and not a test bypass
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const isValid = verifyRazorpaySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        // Mark payment failed
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            notes: 'Signature verification failed',
          })
          .eq('id', orderId);

        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Update order status in Supabase to confirmed and paid
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        razorpay_payment_id,
        razorpay_signature: razorpay_signature || 'verified',
      })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (updateError || !updatedOrder) {
      console.error('Failed to update verified order:', updateError);
      return NextResponse.json({ error: 'Failed to update order state' }, { status: 500 });
    }

    // Send email notification asynchronously
    if (updatedOrder.customer_email) {
      const address = updatedOrder.shipping_address as { address_line_1?: string; city?: string; state?: string; pincode?: string };
      const formattedAddress = `${address.address_line_1 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;

      sendOrderConfirmation({
        customerEmail: updatedOrder.customer_email,
        customerName: updatedOrder.customer_name,
        orderNumber: updatedOrder.order_number,
        orderTotal: updatedOrder.total_amount,
        orderItems: (updatedOrder.order_items || []).map((i: { product_name: string; quantity: number; unit_price: number }) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        shippingAddress: formattedAddress,
      }).catch((e) => console.error('Email dispatch error:', e));
    }

    // Clear the customer's cart
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
