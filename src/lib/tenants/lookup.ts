"use server";

import { createServerActionClient } from '@/lib/supabase/server';

/**
 * Tipos para tenant basados en el esquema de la base de datos
 */
export type TenantStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

/**
 * Interface para tenant obtenido de la base de datos
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  domain: string | null;
  plan_id: string;
  status: TenantStatus;
  owner_platform_user_id: string | null;
  owner_email: string;
  timezone: string;
  currency: string;
  country: string;
  language: string;
  settings: Record<string, any>;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Estados válidos para considerar un tenant activo
 */
export const ACTIVE_TENANT_STATUSES: TenantStatus[] = ['active', 'trial'];

/**
 * Busca un tenant por su slug (subdominio)
 * @param slug - El slug del tenant (parte del subdominio)
 * @returns Tenant si existe y está activo, null caso contrario
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const supabase = createServerActionClient();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        business_type,
        domain,
        plan_id,
        status,
        owner_platform_user_id,
        owner_email,
        timezone,
        currency,
        country,
        language,
        settings,
        trial_ends_at,
        created_at,
        updated_at
      `)
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      return null;
    }

    return tenant as Tenant;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

/**
 * Verifica si un tenant está activo
 * @param tenant - El tenant a verificar
 * @returns true si el tenant está activo, false caso contrario
 */
export function isTenantActive(tenant: Tenant): boolean {
  // Verificar estado
  if (!ACTIVE_TENANT_STATUSES.includes(tenant.status)) {
    return false;
  }

  // Verificar trial expirado (si aplica)
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
 * Busca un tenant activo por su slug
 * @param slug - El slug del tenant
 * @returns Tenant si existe y está activo, null caso contrario
 */
export async function getActiveTenantBySlug(slug: string): Promise<Tenant | null> {
  const tenant = await getTenantBySlug(slug);
  
  if (!tenant || !isTenantActive(tenant)) {
    return null;
  }

  return tenant;
}

/**
 * Valida si un slug es válido para ser usado como subdominio
 * @param slug - El slug a validar
 * @returns true si es válido, false caso contrario
 */
export function isValidTenantSlug(slug: string): boolean {
  // No debe ser 'admin' (reservado para portal de administración)
  if (slug === 'admin') {
    return false;
  }

  // No debe ser 'www' (reservado para dominio principal)
  if (slug === 'www') {
    return false;
  }

  // Debe contener solo caracteres alfanuméricos y guiones
  const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 63;
}

/**
 * Lista de slugs reservados que no pueden ser usados por tenants
 */
export const RESERVED_SLUGS = [
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
 * @returns true si está reservado, false caso contrario
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as any);
}