import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Tipos para tenant en middleware (simplificado)
 */
export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  trial_ends_at: string | null;
}

/**
 * Busca información básica de un tenant por slug desde el middleware
 * @param slug - El slug del tenant
 * @param req - Request de Next.js
 * @param res - Response de Next.js  
 * @returns Información del tenant si existe y está activo, null caso contrario
 */
export async function getTenantInfoBySlug(
  slug: string,
  req: NextRequest,
  res: NextResponse
): Promise<TenantInfo | null> {
  try {
    const supabase = createMiddlewareClient({ req, res });

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug, status, trial_ends_at')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      return null;
    }

    return tenant as TenantInfo;
  } catch (error) {
    console.error('Error fetching tenant info by slug:', error);
    return null;
  }
}

/**
 * Verifica si un tenant está activo
 * @param tenant - Información del tenant
 * @returns true si está activo, false caso contrario
 */
export function isTenantInfoActive(tenant: TenantInfo): boolean {
  // Estados válidos
  const activeStatuses = ['active', 'trial'];
  if (!activeStatuses.includes(tenant.status)) {
    return false;
  }

  // Verificar trial expirado
  if (tenant.status === 'trial' && tenant.trial_ends_at) {
    const trialEndDate = new Date(tenant.trial_ends_at);
    const now = new Date();
    if (trialEndDate < now) {
      return false;
    }
  }

  return true;
}

/**
 * Establece el tenant_id en la sesión de la petición para RLS
 * Nota: En el middleware, solo validamos el tenant. El contexto RLS se establece
 * en las Server Actions y API routes donde se hacen las consultas reales.
 * @param tenantId - ID del tenant para logging
 * @param req - Request de Next.js
 * @param res - Response de Next.js
 */
export async function setTenantContext(
  tenantId: string,
  req: NextRequest,
  res: NextResponse
): Promise<void> {
  try {
    // En el middleware, solo agregamos el tenant_id como header para uso posterior
    res.headers.set('x-tenant-id', tenantId);
    
    // El contexto RLS se establecerá en las funciones que realmente consultan datos
    console.log(`Tenant context set for middleware: ${tenantId}`);
  } catch (error) {
    console.error('Error setting tenant context:', error);
  }
}

/**
 * Lista de slugs reservados que no pueden ser tenants
 */
export const RESERVED_TENANT_SLUGS = [
  'admin',
  'www',
  'api',
  'mail',
  'ftp',
  'localhost',
  'staging',
  'test',
  'dev',
  'development',
  'prod',
  'production',
  'app',
  'dashboard',
  'support',
  'help',
  'docs',
  'blog',
  'status',
] as const;

/**
 * Verifica si un slug está reservado
 * @param slug - El slug a verificar
 * @returns true si está reservado
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_TENANT_SLUGS.includes(slug as any);
}