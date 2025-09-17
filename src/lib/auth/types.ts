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
export interface PlatformUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: PlatformUserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Verifica si un rol es de administrador
 * @param role - El rol a verificar
 * @returns true si es admin, false caso contrario
 */
export function isAdminRole(role: PlatformUserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Valida si un platform user está activo y verificado
 * @param user - El usuario a verificar
 * @returns true si está activo y verificado
 */
export function isPlatformUserActive(user: PlatformUser): boolean {
  return user.is_active && user.is_verified;
}

/**
 * Valida si un platform user es administrador activo
 * @param user - El usuario a verificar
 * @returns true si es admin activo
 */
export function isPlatformUserAdmin(user: PlatformUser): boolean {
  return isPlatformUserActive(user) && isAdminRole(user.role);
}