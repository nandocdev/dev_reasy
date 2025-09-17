"use server";

import { redirect } from "next/navigation";
import { getCurrentPlatformUser, isCurrentUserPlatformAdmin } from "@/lib/auth/platform";

/**
 * Función auxiliar para proteger rutas de administración
 * Redirige automáticamente a login si el usuario no está autenticado o no tiene permisos
 * @returns Los datos del usuario autenticado y autorizado
 */
export async function requirePlatformAdmin() {
  const isAdmin = await isCurrentUserPlatformAdmin();
  
  if (!isAdmin) {
    redirect('/admin/login');
  }

  // Si llegamos aquí, el usuario está autorizado
  const user = await getCurrentPlatformUser();
  
  // Esta verificación extra no debería ser necesaria, pero es por seguridad
  if (!user) {
    redirect('/admin/login');
  }

  return user;
}

/**
 * Función auxiliar para verificar permisos sin redireccionar
 * Útil para verificaciones condicionales en componentes
 * @returns true si el usuario tiene permisos de admin
 */
export async function checkPlatformAdminAccess(): Promise<boolean> {
  try {
    return await isCurrentUserPlatformAdmin();
  } catch (error) {
    console.error('Error checking platform admin access:', error);
    return false;
  }
}