import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { fullName, phone, email, password } = await request.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || cleanEmail.split('@')[0] || 'Customer').trim();
    const cleanPhone = (phone || '').trim();

    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (hasServiceRoleKey) {
      const supabaseAdmin = createAdminClient();

      // 1. Create the user in Supabase Auth with auto-confirmed email (bypasses email verification block)
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          phone: cleanPhone,
        },
      });

      if (createError) {
        // Check if user already exists
        if (
          createError.message.toLowerCase().includes('already') ||
          createError.message.toLowerCase().includes('registered') ||
          createError.message.toLowerCase().includes('exists')
        ) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please sign in.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: createError.message || 'Failed to create user account' },
          { status: 400 }
        );
      }

      if (userData.user) {
        // 2. Ensure customer profile is in profiles table with customer role
        await supabaseAdmin.from('profiles').upsert(
          {
            id: userData.user.id,
            full_name: cleanName,
            phone: cleanPhone,
            role: 'customer',
          },
          { onConflict: 'id' }
        );
      }
    } else {
      // Fallback: standard sign-up via server client
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      });

      if (signUpError) {
        return NextResponse.json(
          { error: signUpError.message || 'Failed to create user account' },
          { status: 400 }
        );
      }

      if (signUpData.user) {
        await supabase.from('profiles').upsert(
          {
            id: signUpData.user.id,
            full_name: cleanName,
            phone: cleanPhone,
            role: 'customer',
          },
          { onConflict: 'id' }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error: unknown) {
    console.error('[Auth Register API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
