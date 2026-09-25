import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRazorpayOrder } from '@/lib/razorpay';
import { calculateDeliveryCharge, parseWeightInKg } from '@/lib/delivery';

export async function POST(request: Request) {
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // Use admin client if service role key is available, else fallback to server client
    let supabase = serverSupabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        supabase = createAdminClient() as any;
      } catch {
        supabase = serverSupabase;
      }
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      couponCode,
      existingOrderId,
    } = await request.json();

    const finalEmail = (customerEmail || user?.email || '').trim().toLowerCase() || null;

    // Handle payment retry for existing unpaid order
    if (existingOrderId) {
      const { data: existingOrder, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', existingOrderId)
        .single();

      if (!fetchErr && existingOrder) {
        if (existingOrder.payment_status === 'paid') {
          return NextResponse.json({ error: 'This order has already been paid.' }, { status: 400 });
        }

        const razorpayOrder = await createRazorpayOrder({
          amount: Number(existingOrder.total_amount),
          currency: 'INR',
          receipt: existingOrder.order_number,
          notes: {
            order_id: existingOrder.id,
            user_id: user ? user.id : 'guest',
            order_number: existingOrder.order_number,
          },
        });

        await supabase
          .from('orders')
          .update({
            razorpay_order_id: razorpayOrder.id,
            payment_status: 'pending',
            order_status: 'awaiting_payment',
          })
          .eq('id', existingOrder.id);

        return NextResponse.json({
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          razorpayOrderId: razorpayOrder.id,
          amount: Number(existingOrder.total_amount),
          currency: 'INR',
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        });
      }
    }

    if (!customerName || !customerPhone || !shippingAddress || !shippingAddress.address_line_1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please provide all mandatory details (Full Name, Phone, Address, City, State, PIN code)' }, { status: 400 });
    }

    // 1. Authoritative verification of products & weights from database
    const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, product_code, selling_price, weight, stock_quantity, is_active')
      .in('id', productIds);

    if (prodError || !dbProducts) {
      return NextResponse.json({ error: 'Failed to verify product information' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Fetch active delivery pricing settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['delivery_base_charge', 'delivery_additional_kg_charge', 'shipping_charge']);

    let baseCharge = 100;
    let additionalCharge = 50;

    if (settingsData) {
      settingsData.forEach((s) => {
        if (s.setting_key === 'delivery_base_charge' && s.setting_value) {
          baseCharge = parseFloat(s.setting_value) || 100;
        } else if (s.setting_key === 'delivery_additional_kg_charge' && s.setting_value) {
          additionalCharge = parseFloat(s.setting_value) || 50;
        } else if (s.setting_key === 'shipping_charge' && s.setting_value && !baseCharge) {
          baseCharge = parseFloat(s.setting_value) || 100;
        }
      });
    }

    // 3. Recalculate Subtotal & Total Weight on Server
    let serverSubtotal = 0;
    let serverTotalWeightKg = 0;

    const validatedItems: Array<{
      productId: string;
      name: string;
      productCode: string;
      imageUrl: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const quantity = Math.max(1, parseInt(String(item.quantity || 1), 10));
      const unitPrice = Number(dbProd.selling_price) || 0;
      const totalPrice = unitPrice * quantity;
      const itemWeightKg = parseWeightInKg(dbProd.weight);

      serverSubtotal += totalPrice;
      serverTotalWeightKg += itemWeightKg * quantity;

      validatedItems.push({
        productId: dbProd.id,
        name: dbProd.name,
        productCode: dbProd.product_code || 'TM',
        imageUrl: item.imageUrl || null,
        quantity,
        unitPrice,
        totalPrice,
      });
    }

    serverTotalWeightKg = Math.round(serverTotalWeightKg * 1000) / 1000;

    // 4. Calculate authoritative delivery charge
    const deliveryCalc = calculateDeliveryCharge(serverTotalWeightKg, baseCharge, additionalCharge);
    const serverShippingFee = deliveryCalc.deliveryCharge;

    // 5. Validate coupon if provided
    let serverDiscountAmount = 0;
    let validCouponCode: string | null = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

      if (coupon && serverSubtotal >= (coupon.minimum_order_amount || 0)) {
        if (coupon.discount_type === 'percentage') {
          serverDiscountAmount = Math.round((serverSubtotal * coupon.discount_value) / 100);
          if (coupon.maximum_discount && serverDiscountAmount > coupon.maximum_discount) {
            serverDiscountAmount = coupon.maximum_discount;
          }
        } else {
          serverDiscountAmount = coupon.discount_value;
        }
        validCouponCode = cleanCode;
      }
    }

    const serverGrandTotal = Math.max(0, serverSubtotal - serverDiscountAmount + serverShippingFee);

    // 6. Create order record in Supabase with initial statuses
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user ? user.id : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: finalEmail,
        shipping_address: shippingAddress,
        subtotal: serverSubtotal,
        discount_amount: serverDiscountAmount,
        shipping_amount: serverShippingFee,
        total_amount: serverGrandTotal,
        coupon_code: validCouponCode,
        payment_method: 'razorpay',
        payment_status: 'pending',
        order_status: 'awaiting_payment',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create DB order:', orderError);
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 });
    }

    // 7. Insert order items snapshot
    const orderItemsToInsert = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_code: item.productCode,
      image_url: item.imageUrl,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    await supabase.from('order_items').insert(orderItemsToInsert);

    // 8. Create Razorpay order
    try {
      const razorpayOrder = await createRazorpayOrder({
        amount: serverGrandTotal,
        currency: 'INR',
        receipt: order.order_number,
        notes: {
          order_id: order.id,
          user_id: user ? user.id : 'guest',
          order_number: order.order_number,
        },
      });

      // Update order with razorpay_order_id
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', order.id);

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        razorpayOrderId: razorpayOrder.id,
        amount: serverGrandTotal,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      });
    } catch (rzpErr) {
      console.error('Razorpay order creation error:', rzpErr);
      return NextResponse.json(
        { error: 'Failed to initiate payment session with Razorpay. Please check payment configuration or try again.' },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error('Razorpay create-order route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
