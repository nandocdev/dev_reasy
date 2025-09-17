import { createServerActionClient } from '@/lib/supabase/server';
import { getTenantBySlug, isTenantActive } from './lookup';

/**
 * Establece el contexto de tenant para RLS en Server Actions
 * @param tenantId - ID del tenant
 */
export async function setServerTenantContext(tenantId: string): Promise<void> {
  try {
    const supabase = createServerActionClient();
    
    // Ejecutar una query para establecer la variable de sesión
    await supabase.rpc('set_app_config', {
      config_name: 'app.current_tenant_id',
      config_value: tenantId
    });
  } catch (error) {
    // Si la función RPC no existe, intentar con SQL directo
    console.warn('RPC function not available, tenant context may not be set correctly');
  }
}

/**
 * Obtiene el tenant ID de los headers de la request
 * @param headers - Headers de Next.js
 * @returns Tenant ID si está disponible
 */
export function getTenantIdFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant-id');
}

/**
 * Valida y obtiene información completa del tenant por slug
 * Función útil para Server Actions y API routes
 * @param slug - El slug del tenant
 * @returns Información del tenant si es válido
 */
export async function validateAndGetTenant(slug: string) {
  const tenant = await getTenantBySlug(slug);
  
  if (!tenant) {
    throw new Error(`Tenant not found: ${slug}`);
  }
  
  if (!isTenantActive(tenant)) {
    throw new Error(`Tenant is not active: ${slug}`);
  }
  
  return tenant;
}

/**
 * Hook para usar en Server Components para establecer contexto de tenant
 * @param slug - El slug del tenant
 */
export async function withTenantContext<T>(
  slug: string,
  callback: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenant = await validateAndGetTenant(slug);
  
  // Establecer contexto antes de ejecutar la función
  await setServerTenantContext(tenant.id);
  
  return callback(tenant.id);
}