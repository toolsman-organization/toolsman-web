import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { file, folder = 'toolsman' } = await request.json();

    if (!file) {
      return NextResponse.json({ error: 'No image file data provided' }, { status: 400 });
    }

    // If Cloudinary keys are not set, return simulated storage for development
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not set in env, returning simulated payload.');
      return NextResponse.json({
        url: file.startsWith('data:') ? file : '/placeholder-product.svg',
        public_id: `toolsman_dev_${Date.now()}`,
      });
    }

    const result = await uploadToCloudinary(file, folder);

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
