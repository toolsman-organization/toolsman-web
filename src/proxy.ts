import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    // Check admin role from profile or metadata
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
      return NextResponse.redirect(
        new URL('/login?error=unauthorized_admin&redirect=/admin', request.url)
      );
    }
  }

  // Protect /account routes (checkout is open to guests as well)
  if (pathname.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  // Handle logged-in users on auth pages (/login, /register)
  if (user && (pathname === '/login' || pathname === '/register')) {
    const rawRedirect = request.nextUrl.searchParams.get('redirect');
    const errorParam = request.nextUrl.searchParams.get('error');

    // Check if user is admin
    let isAdminUser = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin' || user.email?.toLowerCase() === 'admin@toolsman.in';
    if (!isAdminUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        isAdminUser = true;
      }
    }

    // If a logged-in non-admin user is redirected here to sign in as admin, allow them to view the admin login form!
    if (!isAdminUser && (rawRedirect?.startsWith('/admin') || errorParam === 'unauthorized_admin')) {
      return supabaseResponse;
    }

    if (rawRedirect && rawRedirect !== '/' && !rawRedirect.startsWith('/login')) {
      // Prevent redirecting non-admin users back to /admin (which would cause an infinite loop)
      if (rawRedirect.startsWith('/admin') && !isAdminUser) {
        return supabaseResponse;
      }
      return NextResponse.redirect(new URL(rawRedirect, request.url));
    }

    if (isAdminUser) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
