import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No active session found. Your reset link may have expired.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error: unknown) {
    console.error('[Update Password API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
