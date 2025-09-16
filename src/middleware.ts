
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
      if (!url.pathname.startsWith('/admin')) {
        url.pathname = `/admin${url.pathname}`;
        return NextResponse.rewrite(url);
      }
  } 
  
  // Tenant subdomain logic
  else if (subdomain) {
    if (!url.pathname.startsWith('/dashboard')) {
        url.pathname = `/dashboard${url.pathname}`;
        return NextResponse.rewrite(url);
    }
  }

  // Main domain logic
  const isProtectedAppRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');
  
  if (isProtectedAppRoute) {
    // If trying to access /dashboard or /admin on the main domain, redirect to landing
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}
