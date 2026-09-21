-- ============================================================
-- TOOLSMAN — Migration: Production-Ready Razorpay Order & Payment Flow
-- ============================================================

-- 1. Safely update orders check constraints for payment_status and order_status
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded'));

ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_order_status_check 
  CHECK (order_status IN ('pending', 'awaiting_payment', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'));

-- 2. Migrate existing unpaid orders with 'pending' order_status to 'awaiting_payment'
UPDATE public.orders
SET order_status = 'awaiting_payment'
WHERE order_status = 'pending' AND payment_status != 'paid';

-- 3. Set default order_status to 'awaiting_payment'
ALTER TABLE public.orders 
  ALTER COLUMN order_status SET DEFAULT 'awaiting_payment';

-- 4. Create performance indexes for Razorpay lookup
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
