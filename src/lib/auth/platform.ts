"use server";

import { createServerActionClient } from "@/lib/supabase/server";
import { cache } from "react";

/**
 * Tipos de roles de platform_users según el esquema de la base de datos
 */
export type PlatformUserRole = 'super_admin' | 'admin' | 'support' | 'developer';

/**
 * Roles que tienen acceso al portal de administración
 */
export const ADMIN_ROLES: PlatformUserRole[] = ['super_admin', 'admin'];

/**
 * Interface para platform_user obtenido de la base de datos
 */
interface PlatformUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: PlatformUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene la información del platform_user autenticado
 * Esta función está cacheada para evitar múltiples consultas en la misma request
 */
export const getCurrentPlatformUser = cache(async (): Promise<PlatformUser | null> => {
  try {
    const supabase = createServerActionClient();
    
    // Verificar que hay un usuario autenticado
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // Obtener los datos del platform_user desde la tabla
    const { data: platformUser, error: dbError } = await supabase
      .from('platform_users')
      .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
      .eq('email', authUser.email)
      .eq('is_active', true)
      .single();

    if (dbError || !platformUser) {
      return null;
    }

    return platformUser as PlatformUser;
  } catch (error) {
    console.error('Error getting current platform user:', error);
    return null;
  }
});

/**
 * Verifica si el usuario actual es un administrador de plataforma
 * @returns true si el usuario tiene rol de super_admin o admin y está activo
 */
export async function isCurrentUserPlatformAdmin(): Promise<boolean> {
  const platformUser = await getCurrentPlatformUser();
  
  if (!platformUser) {
    return false;
  }

  return ADMIN_ROLES.includes(platformUser.role) && platformUser.is_active;
}

/**
 * Verifica si el usuario actual tiene un rol específico
 * @param requiredRole - El rol requerido
 * @returns true si el usuario tiene el rol especificado y está activo
 */
export async function hasCurrentUserRole(requiredRole: PlatformUserRole): Promise<boolean> {
  const platformUser = await getCurrentPlatformUser();
  
  if (!platformUser) {
    return false;
  }

  return platformUser.role === requiredRole && platformUser.is_active;
}

/**
 * Verifica si el usuario actual tiene alguno de los roles especificados
 * @param allowedRoles - Array de roles permitidos
 * @returns true si el usuario tiene alguno de los roles y está activo
 */
export async function hasCurrentUserAnyRole(allowedRoles: PlatformUserRole[]): Promise<boolean> {
  const platformUser = await getCurrentPlatformUser();
  
  if (!platformUser) {
    return false;
  }

  return allowedRoles.includes(platformUser.role) && platformUser.is_active;
}

/**
 * Obtiene información básica del usuario para mostrar en la UI
 * @returns Información del usuario o null si no está autenticado/autorizado
 */
export async function getCurrentPlatformUserInfo(): Promise<{
  id: string;
  email: string;
  fullName: string;
  role: PlatformUserRole;
} | null> {
  const platformUser = await getCurrentPlatformUser();
  
  if (!platformUser) {
    return null;
  }

  return {
    id: platformUser.id,
    email: platformUser.email,
    fullName: `${platformUser.first_name} ${platformUser.last_name}`,
    role: platformUser.role,
  };
}