import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderStatusUpdate } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      type,
      customerEmail,
      customerName,
      orderNumber,
      newStatus,
      note,
    } = await request.json();

    if (type === 'status_update') {
      await sendOrderStatusUpdate({
        customerEmail,
        customerName,
        orderNumber,
        newStatus,
        note,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Brevo route error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
