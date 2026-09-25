-- ============================================================
-- Migration: Enable Realtime for Orders Table
-- Allows authenticated admin client to receive instant INSERT
-- events when new customer orders are placed.
-- ============================================================

DO $$
BEGIN
  -- Add public.orders to supabase_realtime publication if not already included
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
