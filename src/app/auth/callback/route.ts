import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');

  let targetPath = nextParam || (type === 'recovery' ? '/reset-password' : '/');
  if (type === 'recovery') {
    targetPath = '/reset-password';
  }

  const redirectTo = `${origin}${targetPath}`;
  const response = NextResponse.redirect(redirectTo);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // 1. PKCE Code Exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error('[Auth Callback] exchangeCodeForSession error:', error.message);
  }

  // 2. Token Hash Verification (for recovery / magiclink)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return response;
    }
    console.error('[Auth Callback] verifyOtp error:', error.message);
  }

  // 3. Fallback for hash fragments: Return client bridge so browser does not drop #access_token
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifying Auth...</title>
  <script>
    (function() {
      var hash = window.location.hash || '';
      var search = window.location.search || '';
      var target = '/reset-password' + search + hash;
      window.location.replace(target);
    })();
  </script>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
  <p>Connecting to secure session...</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
