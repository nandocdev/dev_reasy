
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from './lib/supabase/server';

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
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const isDevelopment = hostname.includes('localhost');
  const mainDomain = isDevelopment ? 'localhost:9002' : 'reasy.app';
  
  let subdomain = '';
  if (hostname.includes(mainDomain)) {
      subdomain = hostname.replace(`.${mainDomain}`, '').split('.')[0];
  }

  const isSubdomainRequest = hostname !== mainDomain && !hostname.endsWith(`.${mainDomain}`);

  if (subdomain === 'admin') {
      const supabase = createServerClient();
      const { data: { session } } = await supabase.auth.getSession();

      const isAdminRoute = url.pathname.startsWith('/admin');
      const isLoginPage = url.pathname === '/admin/login';

      if (!session && isAdminRoute && !isLoginPage) {
          // Si no hay sesión y se intenta acceder a una ruta de admin (que no sea el login),
          // redirigir a la página de login de admin.
          const loginUrl = new URL('/admin/login', req.url);
          return NextResponse.redirect(loginUrl);
      } else if (session && isLoginPage) {
          // Si hay sesión y se intenta acceder a la página de login,
          // redirigir al dashboard de admin.
          const dashboardUrl = new URL('/admin/dashboard', req.url);
          return NextResponse.redirect(dashboardUrl);
      }
      
      // Reescribe la ruta para que la aplicación la maneje como /admin/...
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);

  } else if (subdomain) {
    // Es un subdominio de tenant.
    console.log(`Rewriting for tenant: ${subdomain}`);
    url.pathname = `/dashboard${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Peticiones al dominio principal (no subdominios)
  const isProtectedAppRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');
  
  if (isProtectedAppRoute) {
    // Redirigir a la landing si se intenta acceder a /dashboard o /admin directamente
    // en el dominio principal.
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}
