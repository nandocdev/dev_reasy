
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  // El matcher asegura que el middleware se ejecute en todas las rutas
  // excepto en las que son para archivos estáticos (_next/static, _next/image, favicon.ico)
  // o rutas de API.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Asumimos que el dominio de producción es `reasy.app`.
  // Para desarrollo, `localhost:9002` se trata como el dominio principal.
  const isDevelopment = hostname.includes('localhost');
  const mainDomain = isDevelopment ? 'localhost:9002' : 'reasy.app';

  // Extrae el subdominio.
  // Ej: 'admin.reasy.app' -> 'admin'
  // Ej: 'acme.reasy.app' -> 'acme'
  // Ej: 'reasy.app' -> null
  const subdomain = hostname.split('.')[0];
  const isSubdomainRequest = hostname !== mainDomain;

  if (isSubdomainRequest) {
    // Si hay un subdominio
    if (subdomain === 'admin') {
      // Si el subdominio es 'admin', reescribe la ruta al portal de administración.
      // Ej: 'admin.reasy.app/dashboard' -> '/admin/dashboard'
      console.log(`Rewriting to /admin${url.pathname}`);
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    } else {
      // Es un subdominio de tenant. Por ahora, reescribimos al dashboard principal.
      // Más adelante (Tarea 1.7), aquí se obtendrá el ID del tenant desde el slug
      // y se pasará a la aplicación.
      console.log(`Rewriting to /dashboard for tenant: ${subdomain}`);
      url.pathname = `/dashboard${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
  // Si no es un subdominio y se intenta acceder a /dashboard o /admin directamente,
  // se debe redirigir a la página de login o a la landing.
  if (!isSubdomainRequest && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin'))) {
    // Por ahora, redirigimos a la landing. En el futuro, a una página de login específica.
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si no hay subdominio, permite que la petición continúe a la página solicitada (ej. la landing page).
  return NextResponse.next();
}
