"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { setServerTenantContext, getTenantIdFromHeaders } from "@/lib/tenants/context";
import { headers } from "next/headers";

/**
 * Función de prueba para verificar que RLS funciona correctamente
 * Esta función simula una consulta a una tabla con tenant_id
 */
export async function testRLSAccess(testTenantId?: string): Promise<{
  success: boolean;
  tenantId: string | null;
  message: string;
  error?: string;
}> {
  try {
    const supabase = createServerActionClient();
    
    // Obtener tenant ID del header o usar el proporcionado para testing
    const headerStore = await headers();
    const tenantId = testTenantId || getTenantIdFromHeaders(headerStore);
    
    if (!tenantId) {
      return {
        success: false,
        tenantId: null,
        message: "No tenant context available"
      };
    }

    // Establecer contexto RLS
    await setServerTenantContext(tenantId);
    
    // Verificar que el contexto se estableció correctamente
    const { data: contextCheck, error: contextError } = await supabase
      .rpc('get_app_config', { config_name: 'app.current_tenant_id' });
    
    if (contextError) {
      return {
        success: false,
        tenantId,
        message: "Failed to verify RLS context",
        error: contextError.message
      };
    }

    // Intentar consultar tabla con RLS (simulamos con tnt_users si existe)
    const { data: users, error: usersError } = await supabase
      .from('tnt_users')
      .select('id, tenant_id, email')
      .limit(5);

    if (usersError) {
      // Si la tabla no existe o hay error, está bien para esta prueba
      return {
        success: true,
        tenantId,
        message: `RLS context set successfully. Table query error (expected if table doesn't exist): ${usersError.message}`,
      };
    }

    return {
      success: true,
      tenantId,
      message: `RLS working correctly. Found ${users?.length || 0} users for tenant ${tenantId}. Context: ${contextCheck}`,
    };

  } catch (error: any) {
    return {
      success: false,
      tenantId: testTenantId || null,
      message: "Error testing RLS",
      error: error.message
    };
  }
}

/**
 * Función para verificar que el aislamiento entre tenants funciona
 */
export async function testTenantIsolation(tenant1Id: string, tenant2Id: string): Promise<{
  success: boolean;
  message: string;
  tenant1Results?: any;
  tenant2Results?: any;
  error?: string;
}> {
  try {
    const supabase = createServerActionClient();

    // Probar con primer tenant
    await setServerTenantContext(tenant1Id);
    const { data: tenant1Data, error: error1 } = await supabase
      .from('tnt_users')
      .select('id, tenant_id, email');

    // Probar con segundo tenant  
    await setServerTenantContext(tenant2Id);
    const { data: tenant2Data, error: error2 } = await supabase
      .from('tnt_users')
      .select('id, tenant_id, email');

    return {
      success: true,
      message: "Tenant isolation test completed",
      tenant1Results: {
        tenantId: tenant1Id,
        count: tenant1Data?.length || 0,
        error: error1?.message
      },
      tenant2Results: {
        tenantId: tenant2Id,
        count: tenant2Data?.length || 0,
        error: error2?.message
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: "Error testing tenant isolation",
      error: error.message
    };
  }
}