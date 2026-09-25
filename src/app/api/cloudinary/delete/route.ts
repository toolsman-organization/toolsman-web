import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    let isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin' || user.email?.toLowerCase() === 'admin@toolsman.in';

    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json({ error: 'Missing public_id' }, { status: 400 });
    }

    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      await deleteFromCloudinary(public_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
