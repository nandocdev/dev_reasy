"use server";

import { createServerActionClient } from '@/lib/supabase/server';
import { Tenant, isTenantActive } from './utils';

/**
 * Busca un tenant por su slug (subdominio)
 * @param slug - El slug del tenant (parte del subdominio)
 * @returns Tenant si existe, null caso contrario
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