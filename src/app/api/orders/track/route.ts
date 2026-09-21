import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { orderNumber, identifier } = await request.json();

    if (!orderNumber || !identifier) {
      return NextResponse.json(
        { error: 'Please provide both Order Number and Phone Number or Email.' },
        { status: 400 }
      );
    }

    const cleanOrderNum = orderNumber.trim().toUpperCase();
    const cleanIdentifier = identifier.trim().toLowerCase();

    const supabase = await createClient();

    // Query order with verification of phone or email
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        subtotal,
        discount_amount,
        shipping_amount,
        total_amount,
        coupon_code,
        payment_method,
        payment_status,
        order_status,
        razorpay_payment_id,
        notes,
        created_at,
        updated_at,
        order_items (
          id,
          product_name,
          product_code,
          image_url,
          quantity,
          unit_price,
          total_price
        ),
        status_history:order_status_history (
          id,
          status,
          note,
          created_at
        )
      `)
      .eq('order_number', cleanOrderNum)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { error: 'No order found matching this Order Number.' },
        { status: 404 }
      );
    }

    // Security check: Verify that either phone or email matches the order
    const orderPhone = (order.customer_phone || '').replace(/\D/g, '');
    const inputDigits = cleanIdentifier.replace(/\D/g, '');
    const orderEmail = (order.customer_email || '').trim().toLowerCase();

    const isEmailMatch = cleanIdentifier.includes('@') && orderEmail === cleanIdentifier;
    const isPhoneMatch = inputDigits.length >= 8 && (orderPhone.endsWith(inputDigits) || inputDigits.endsWith(orderPhone));

    if (!isEmailMatch && !isPhoneMatch) {
      return NextResponse.json(
        { error: 'The provided phone number or email does not match this order.' },
        { status: 403 }
      );
    }

    // Sort status history chronologically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedHistory = ((order as any).status_history || []).sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        status_history: sortedHistory,
      },
    });
  } catch (err: unknown) {
    console.error('[Track Order API] Error:', err);
    return NextResponse.json({ error: 'Failed to look up order status.' }, { status: 500 });
  }
}
