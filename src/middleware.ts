
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from './lib/supabase/middleware';

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
  const { supabase, response } = createMiddlewareClient(req);
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const isDevelopment = hostname.includes('localhost');
  const mainDomain = isDevelopment ? 'localhost:9002' : 'reasy.app';
  
  let subdomain = '';
  if (hostname.includes(mainDomain) && hostname !== mainDomain) {
      subdomain = hostname.split('.')[0];
  }

  // Manejo de subdominio 'admin'
  if (subdomain === 'admin') {
      const { data: { session } } = await supabase.auth.getSession();
      const isAdminRoute = url.pathname.startsWith('/admin');
      const isLoginPage = url.pathname === '/admin/login';

      if (!session && isAdminRoute && !isLoginPage) {
          const loginUrl = new URL('/admin/login', req.url);
          return NextResponse.redirect(loginUrl);
      } else if (session && isLoginPage) {
          const dashboardUrl = new URL('/admin/dashboard', req.url);
          return NextResponse.redirect(dashboardUrl);
      }
      
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url, { request: { headers: req.headers } });
  } 
  // Manejo de subdominios de tenants
  else if (subdomain) {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', subdomain)
      .single();

    if (error || !tenant) {
      // Si el subdominio no corresponde a un tenant, redirigir
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Reescribir la ruta para que la aplicación la maneje como /dashboard/...
    if (url.pathname === '/') {
        url.pathname = `/dashboard`;
    } else {
        url.pathname = `/dashboard${url.pathname}`;
    }
    return NextResponse.rewrite(url, { request: { headers: req.headers } });
  }

  // Peticiones al dominio principal (no subdominios)
  const isProtectedAppRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');
  
  if (isProtectedAppRoute) {
    // Redirigir a la landing si se intenta acceder a /dashboard o /admin directamente
    return NextResponse.redirect(new URL('/', req.url));
  }

  return response;
}
