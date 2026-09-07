import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDeliveryCharge, parseWeightInKg } from '@/lib/delivery';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please login to place an order.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      couponCode,
      paymentMethod = 'cod',
    } = body;

    if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order parameters or empty items list' }, { status: 400 });
    }

    // 1. Fetch authoritative product details from database for all items
    const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean);
    const { data: dbProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, product_code, selling_price, weight, stock_quantity, is_active')
      .in('id', productIds);

    if (prodError || !dbProducts) {
      return NextResponse.json({ error: 'Failed to verify product information' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Fetch active site settings for delivery charges
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

    // Round total weight
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

    // 6. Insert order record into database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || user.email,
        shipping_address: shippingAddress,
        subtotal: serverSubtotal,
        discount_amount: serverDiscountAmount,
        shipping_amount: serverShippingFee,
        total_amount: serverGrandTotal,
        coupon_code: validCouponCode,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        order_status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order in DB:', orderError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      shippingAmount: serverShippingFee,
      totalWeightKg: serverTotalWeightKg,
      chargeableWeightKg: deliveryCalc.chargeableWeightKg,
      totalAmount: serverGrandTotal,
    });
  } catch (err: unknown) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'An unexpected error occurred creating order' },
      { status: 500 }
    );
  }
}
