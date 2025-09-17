/**
 * Test básico para verificar el flujo de autenticación de administradores
 * Este archivo contiene ejemplos de cómo usar las funciones de autenticación
 */

import { 
  getCurrentPlatformUser, 
  isCurrentUserPlatformAdmin, 
  hasCurrentUserRole,
  getCurrentPlatformUserInfo 
} from '@/lib/auth/platform';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

/**
 * Ejemplo de uso en Server Components
 */
export async function ExampleServerComponent() {
  // Proteger toda la página/componente
  const user = await requirePlatformAdmin();
  
  // O verificar manualmente
  const isAdmin = await isCurrentUserPlatformAdmin();
  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  // Obtener información del usuario para mostrar
  const userInfo = await getCurrentPlatformUserInfo();
  
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {userInfo?.fullName}</p>
      <p>Role: {userInfo?.role}</p>
    </div>
  );
}

/**
 * Ejemplo de uso en Server Actions
 */
export async function exampleAdminAction() {
  "use server";
  
  // Verificar permisos al inicio de la acción
  const isAdmin = await isCurrentUserPlatformAdmin();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // O verificar rol específico
  const isSuperAdmin = await hasCurrentUserRole('super_admin');
  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Super admin access required');
  }

  // Realizar acción administrativa...
  console.log('Admin action executed');
}

/**
 * NOTAS IMPORTANTES PARA LOS DESARROLLADORES:
 * 
 * 1. SIEMPRE usar las funciones helper en lugar de consultas directas a Supabase
 * 2. Para páginas admin, usar requirePlatformAdmin() al inicio del componente
 * 3. Para Server Actions admin, verificar isCurrentUserPlatformAdmin() al inicio
 * 4. El middleware ya protege las rutas /admin/* automáticamente
 * 5. Los roles disponibles son: 'super_admin', 'admin', 'support', 'developer'
 * 6. Solo 'super_admin' y 'admin' tienen acceso al portal de administración
 */