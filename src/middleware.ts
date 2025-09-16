
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession();

  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const isDevelopment = hostname.includes('localhost');
  const mainDomain = isDevelopment ? 'localhost:9002' : 'reasy.app';
  
  let subdomain = '';
  if (hostname.includes(mainDomain) && hostname !== mainDomain) {
      subdomain = hostname.split('.')[0];
  }

  // Admin subdomain logic
  if (subdomain === 'admin') {
      const isAdminRoute = url.pathname.startsWith('/admin');
      const isLoginPage = url.pathname === '/admin/login';

      if (!session && isAdminRoute && !isLoginPage) {
          return NextResponse.redirect(new URL('/admin/login', req.url));
      } else if (session && isLoginPage) {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      
      // Rewrite to the admin path
      if (!url.pathname.startsWith('/admin')) {
        url.pathname = `/admin${url.pathname}`;
      }
      return NextResponse.rewrite(url, { headers: res.headers });
  } 
  
  // Tenant subdomain logic
  else if (subdomain) {
    // This part requires a database call which was part of the issue.
    // For now, we will assume the tenant exists and rewrite to the dashboard.
    // The RLS logic will depend on a subsequent server-side action.
    if (url.pathname === '/') {
        url.pathname = `/dashboard`;
    } else if (!url.pathname.startsWith('/dashboard')) {
        url.pathname = `/dashboard${url.pathname}`;
    }
    return NextResponse.rewrite(url, { headers: res.headers });
  }

  // Main domain logic
  const isProtectedAppRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');
  
  if (isProtectedAppRoute) {
    // If trying to access /dashboard or /admin on the main domain, redirect to landing
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}
