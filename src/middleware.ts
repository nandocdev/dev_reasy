
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { 
  getTenantInfoBySlug, 
  isTenantInfoActive, 
  setTenantContext,
  isReservedSlug 
} from '@/lib/tenants/middleware'

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

  // Create a response that we can modify
  const res = NextResponse.next();

  // Create supabase middleware client
  const supabase = createMiddlewareClient({ req, res });

  const isDevelopment = hostname.includes('localhost');
  const mainDomain = isDevelopment ? 'localhost:9002' : 'reasy.app';
  
  let subdomain = '';
  if (hostname.includes(mainDomain) && hostname !== mainDomain) {
      subdomain = hostname.split('.')[0];
  }

  // Admin subdomain logic
  if (subdomain === 'admin') {
      // Check if user is trying to access admin routes
      if (!url.pathname.startsWith('/admin')) {
        url.pathname = `/admin${url.pathname}`;
      }

      // For admin routes, check authentication and authorization
      if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
        // Get the user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session, redirect to admin login
          return NextResponse.redirect(new URL('/admin/login', req.url));
        }

        // Check if user is a platform admin
        try {
          const { data: platformUser, error } = await supabase
            .from('platform_users')
            .select('role, is_active')
            .eq('email', session.user.email)
            .eq('is_active', true)
            .single();

          if (error || !platformUser) {
            // User not found in platform_users or inactive
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL('/admin/login', req.url));
          }

          // Check if user has admin role (super_admin or admin)
          const adminRoles = ['super_admin', 'admin'];
          if (!adminRoles.includes(platformUser.role)) {
            // User doesn't have admin role
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL('/admin/login', req.url));
          }
        } catch (error) {
          console.error('Error checking platform user role:', error);
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL('/admin/login', req.url));
        }
      }

      return NextResponse.rewrite(url, { request: { headers: req.headers } });
  } 
  
  // Tenant subdomain logic
  else if (subdomain) {
    // Check if it's a reserved slug
    if (isReservedSlug(subdomain)) {
      // Reserved slug not allowed as tenant
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Lookup tenant by subdomain
    const tenantInfo = await getTenantInfoBySlug(subdomain, req, res);
    
    if (!tenantInfo) {
      // Tenant not found, redirect to main domain
      const mainDomainUrl = new URL('/', req.url);
      mainDomainUrl.hostname = mainDomain;
      return NextResponse.redirect(mainDomainUrl);
    }

    if (!isTenantInfoActive(tenantInfo)) {
      // Tenant inactive, show maintenance page or redirect
      const mainDomainUrl = new URL('/', req.url);
      mainDomainUrl.hostname = mainDomain;
      return NextResponse.redirect(mainDomainUrl);
    }

    // Set tenant context for RLS
    await setTenantContext(tenantInfo.id, req, res);

    // Redirect to dashboard if not already there
    if (!url.pathname.startsWith('/dashboard')) {
        url.pathname = `/dashboard${url.pathname}`;
        return NextResponse.rewrite(url, { request: { headers: req.headers } });
    }

    return NextResponse.next();
  }

  // Main domain logic
  const isProtectedAppRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');
  
  if (isProtectedAppRoute) {
    // If trying to access /dashboard or /admin on the main domain, redirect to landing
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}
