
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  // El matcher asegura que el middleware se ejecute en todas las rutas
  // excepto en las que son para archivos estáticos (_next/static, _next/image, favicon.ico)
  // o rutas de API.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
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
  const subdomain = hostname.replace(`.${mainDomain}`, '');

  if (subdomain !== mainDomain && subdomain !== '') {
    // Si hay un subdominio
    if (subdomain === 'admin') {
      // Si el subdominio es 'admin', reescribe la ruta a /admin
      // req.url es /dashboard, se reescribe a /admin/dashboard
      console.log(`Rewriting to /admin${url.pathname}`);
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    } else {
      // Es un subdominio de tenant, reescribe a la página de booking
      // Más adelante, aquí se obtendrá el ID del tenant desde el slug
      console.log(`Rewriting to /booking for tenant: ${subdomain}`);
      url.pathname = `/booking`;
      return NextResponse.rewrite(url);
    }
  }

  // Si no hay subdominio, permite que la petición continúe a la página solicitada (ej. la landing page).
  return NextResponse.next();
}
