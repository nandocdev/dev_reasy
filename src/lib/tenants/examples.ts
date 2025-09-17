/**
 * Ejemplo de cómo usar las funciones de contexto de tenant
 * Este archivo muestra patrones de uso en diferentes escenarios
 */

import { withTenantContext, validateAndGetTenant, setServerTenantContext } from '@/lib/tenants/context';
import { createServerActionClient } from '@/lib/supabase/server';

// ===============================================
// PATRÓN 1: Server Action con contexto de tenant
// ===============================================

export async function createServiceAction(
  tenantSlug: string,
  formData: FormData
) {
  "use server";
  
  try {
    // Usar el helper para validar tenant y establecer contexto automáticamente
    return await withTenantContext(tenantSlug, async (tenantId) => {
      const supabase = createServerActionClient();
      
      // A partir de aquí, todas las consultas respetarán RLS automáticamente
      const { data: service, error } = await supabase
        .from('tnt_services')
        .insert({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          duration_minutes: parseInt(formData.get('duration') as string),
          // No necesitamos especificar tenant_id, RLS lo maneja
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, service };
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return { error: 'Failed to create service' };
  }
}

// ===============================================
// PATRÓN 2: Server Component con contexto manual
// ===============================================

export async function getTenantDashboardData(slug: string) {
  try {
    // Validar tenant manualmente
    const tenant = await validateAndGetTenant(slug);
    
    // Establecer contexto
    await setServerTenantContext(tenant.id);
    
    // Obtener datos del tenant (RLS aplicará automáticamente)
    const supabase = createServerActionClient();
    const { data: services } = await supabase
      .from('tnt_services')
      .select('*')
      .eq('status', 'active');
    
    return {
      tenant,
      services: services || [],
      stats: {
        totalServices: services?.length || 0
      }
    };
  } catch (error) {
    throw new Error('Tenant not found or inactive');
  }
}

// ===============================================
// PATRÓN 3: API Route con contexto de tenant
// ===============================================

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    return await withTenantContext(params.slug, async (tenantId) => {
      const supabase = createServerActionClient();
      
      const { data: bookings, error } = await supabase
        .from('tnt_bookings')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time');
      
      if (error) throw error;
      
      return Response.json({ bookings });
    });
  } catch (error) {
    return Response.json(
      { error: 'Tenant not found or inactive' }, 
      { status: 404 }
    );
  }
}

// ===============================================
// PATRÓN 4: Función utilitaria con contexto
// ===============================================

export async function getTenantStats(tenantSlug: string) {
  return await withTenantContext(tenantSlug, async (tenantId) => {
    const supabase = createServerActionClient();
    
    // Todas estas consultas respetarán RLS automáticamente
    const [
      { count: totalServices },
      { count: totalBookings },
      { count: totalCustomers }
    ] = await Promise.all([
      supabase
        .from('tnt_services')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('tnt_bookings')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('tnt_customers')
        .select('*', { count: 'exact', head: true })
    ]);
    
    return {
      tenantId,
      stats: {
        services: totalServices,
        bookings: totalBookings,
        customers: totalCustomers
      }
    };
  });
}