import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please provide a coupon code' }, { status: 400 });
    }

    const supabase = await createClient();

    // Query active coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    const total = parseFloat(orderTotal) || 0;

    if (total < coupon.minimum_order_amount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${coupon.minimum_order_amount} required for this coupon` },
        { status: 400 }
      );
    }

    // Check dates if any
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ error: 'Coupon is not yet active' }, { status: 400 });
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((total * coupon.discount_value) / 100);
      if (coupon.maximum_discount) {
        discount = Math.min(discount, coupon.maximum_discount);
      }
    } else {
      discount = coupon.discount_value;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_amount: discount,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        description: coupon.description,
      },
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ error: 'Server error validating coupon' }, { status: 500 });
  }
}
