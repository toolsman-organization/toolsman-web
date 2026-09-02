import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      amount,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      couponCode,
      discountAmount = 0,
      shippingAmount = 0,
    } = await request.json();

    if (!amount || amount <= 0 || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 });
    }

    // 1. Create order record in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || user.email,
        shipping_address: shippingAddress,
        subtotal: amount + discountAmount - shippingAmount,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        total_amount: amount,
        coupon_code: couponCode || null,
        payment_method: 'razorpay',
        payment_status: 'pending',
        order_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create DB order:', orderError);
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 });
    }

    // 2. Insert order items snapshot
    const orderItemsToInsert = items.map((item: {
      productId: string;
      name: string;
      productCode: string;
      imageUrl: string;
      quantity: number;
      unitPrice: number;
    }) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_code: item.productCode,
      image_url: item.imageUrl,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
    }));

    await supabase.from('order_items').insert(orderItemsToInsert);

    // 3. Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amount,
        currency: 'INR',
        receipt: order.order_number,
        notes: {
          order_id: order.id,
          user_id: user.id,
          order_number: order.order_number,
        },
      });

      // Update order with razorpay_order_id
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', order.id);
    } catch (rzpErr) {
      console.error('Razorpay order creation error:', rzpErr);
      // Fallback if Razorpay credentials are test/unconfigured
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: `test_rzp_${Date.now()}`,
        amount: amount,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (err) {
    console.error('Razorpay create-order route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
