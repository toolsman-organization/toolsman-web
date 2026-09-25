import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail, getSiteBaseUrl, isValidEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const siteUrl = getSiteBaseUrl();
    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasBrevoKey = Boolean(process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.includes('your-brevo-api-key'));

    // Option A: If Service Role Key & Brevo are configured, generate link and send custom branded email via Brevo
    if (hasServiceRoleKey && hasBrevoKey) {
      try {
        const supabaseAdmin = createAdminClient();

        // Check user existence in profiles table or auth admin
        let userName: string | undefined = undefined;
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('email', cleanEmail)
            .maybeSingle();
          if (profile?.full_name) userName = profile.full_name;
        } catch {
          // ignore profile lookup failure
        }

        // Generate recovery link directly to /reset-password so the client receives hash/code immediately
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: `${siteUrl}/reset-password`,
          },
        });

        if (linkError) {
          console.warn('[Forgot Password] Supabase admin link error:', linkError.message);
          const msg = linkError.message.toLowerCase();
          if (msg.includes('not found') || msg.includes('user') || msg.includes('invalid') || msg.includes('unable')) {
            return NextResponse.json(
              { error: 'This email is not registered. Please check and try again.' },
              { status: 404 }
            );
          }
        }

        const resetUrl = linkData?.properties?.action_link;
        if (resetUrl) {
          const emailSent = await sendPasswordResetEmail({
            recipientEmail: cleanEmail,
            recipientName: userName,
            resetUrl,
          });

          if (emailSent) {
            return NextResponse.json({
              success: true,
              message: 'Password reset instructions have been sent to your email.',
            });
          }
        }
      } catch (adminError) {
        console.warn('[Forgot Password] Admin/Brevo method failed, falling back to Supabase client auth:', adminError);
      }
    }

    // Option B: Standard Supabase Auth resetPasswordForEmail (Built-in Supabase Auth email)
    // Works directly with standard Supabase URL & Anon key!
    const supabase = await createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (resetError) {
      console.error('[Forgot Password] Supabase reset error:', resetError);
      return NextResponse.json(
        { error: resetError.message || 'Unable to send reset email. Please try again later.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error: unknown) {
    console.error('[Auth Forgot Password API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process password recovery' },
      { status: 500 }
    );
  }
}

