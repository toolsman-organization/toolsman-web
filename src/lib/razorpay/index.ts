import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

/**
 * Get or create Razorpay instance.
 * SERVER SIDE ONLY.
 */
export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

export interface CreateRazorpayOrderParams {
  amount: number; // amount in paise (multiply rupees by 100)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

/**
 * Create a new Razorpay order.
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<RazorpayOrder> {
  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: Math.round(params.amount * 100), // convert to paise
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes ?? {},
  });

  return order as unknown as RazorpayOrder;
}

/**
 * Verify Razorpay payment signature.
 * This MUST be done server-side before marking payment as paid.
 */
export function verifyRazorpaySignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error('Missing RAZORPAY_KEY_SECRET');

  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === params.razorpay_signature;
}
