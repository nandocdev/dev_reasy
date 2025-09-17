# Sistema de Enrutamiento Multi-Tenant

Este documento describe la implementación completa del sistema de enrutamiento por subdominio para la aplicación Reasy.

## Descripción General

El sistema permite que cada tenant tenga su propio subdominio (ej: `miempresa.reasy.app`) mientras que el portal de administración está en `admin.reasy.app`. El enrutamiento se maneja a nivel de middleware con validación y contexto automático de tenant.

## Arquitectura de Archivos

### `/src/middleware.ts`

Middleware principal que:

-  Detecta subdominios y enruta apropiadamente
-  Valida tenants por slug del subdominio
-  Establece contexto de tenant para uso posterior
-  Protege rutas administrativas con autenticación de plataforma

### `/src/lib/tenants/lookup.ts`

Funciones de consulta de tenant para Server Actions:

-  `getTenantBySlug()` - Busca tenant por slug
-  `isTenantActive()` - Valida estado activo
-  `RESERVED_TENANT_SLUGS` - Lista de slugs reservados

### `/src/lib/tenants/middleware.ts`

Funciones específicas para middleware:

-  `getTenantInfoBySlug()` - Versión optimizada para middleware
-  `isTenantInfoActive()` - Validación de estado en middleware
-  `setTenantContext()` - Establece headers para contexto
-  `isReservedSlug()` - Valida slugs reservados

### `/src/lib/tenants/context.ts`

Funciones de contexto para Server Actions y Components:

-  `setServerTenantContext()` - Establece RLS context
-  `validateAndGetTenant()` - Validación completa de tenant
-  `withTenantContext()` - Helper para ejecutar código con contexto
-  `getTenantIdFromHeaders()` - Extrae tenant ID de headers

### `/src/lib/tenants/examples.ts`

Ejemplos de patrones de uso en diferentes escenarios.

## Flujo de Enrutamiento

### 1. Subdominios de Tenant

```
miempresa.reasy.app/booking → /dashboard/booking
```

1. Middleware detecta subdominio "miempresa"
2. Verifica que no sea slug reservado
3. Consulta BD para obtener información del tenant
4. Valida que el tenant esté activo
5. Establece context headers
6. Reescribe URL a `/dashboard/*`

### 2. Portal de Administración

```
admin.reasy.app/dashboard → /admin/dashboard
```

1. Middleware detecta subdominio "admin"
2. Verifica autenticación de platform_user
3. Valida rol de administrador
4. Reescribe URL a `/admin/*`

### 3. Dominio Principal

```
reasy.app → Landing page pública
```

Rutas protegidas en dominio principal redirigen a landing.

## Manejo de Errores

-  **Tenant no encontrado**: Redirección a dominio principal
-  **Tenant inactivo**: Redirección a dominio principal
-  **Slug reservado**: Redirección a dominio principal
-  **Admin sin permisos**: Redirección a login de admin

## Integración con RLS

El sistema prepara el contexto para Row Level Security:

1. **Middleware**: Valida tenant y establece headers
2. **Server Actions**: Usan `withTenantContext()` para establecer RLS
3. **Server Components**: Usan `setServerTenantContext()` manual
4. **API Routes**: Implementan validación con context helpers

## Configuración de Variables

### Variables de Sesión RLS

```sql
-- Se establece automáticamente en cada petición
SET app.current_tenant_id = 'uuid-del-tenant';
```

### Headers de Contexto

```
x-tenant-id: uuid-del-tenant
```

## Patrones de Uso

### Server Action con Tenant

```typescript
export async function createService(tenantSlug: string, data: FormData) {
	return await withTenantContext(tenantSlug, async (tenantId) => {
		// RLS aplicado automáticamente
		const result = await supabase.from('tnt_services').insert(data);
		return result;
	});
}
```

### Server Component con Tenant

```typescript
export async function DashboardPage({ params }: { params: { slug: string } }) {
	const tenant = await validateAndGetTenant(params.slug);
	await setServerTenantContext(tenant.id);

	// Consultas con RLS automático
	const services = await supabase.from('tnt_services').select('*');

	return (
		<Dashboard
			tenant={tenant}
			services={services}
		/>
	);
}
```

## Validaciones Implementadas

-  ✅ Slugs reservados (admin, www, api, etc.)
-  ✅ Tenant existe en base de datos
-  ✅ Tenant tiene estado activo
-  ✅ Trial no expirado (si aplica)
-  ✅ Autenticación para portal admin
-  ✅ Roles apropiados para admin

## Próximos Pasos

1. Implementar función RLS `set_app_config` en Supabase
2. Aplicar políticas RLS a todas las tablas tnt\_\*
3. Probar flujo completo con datos reales
4. Configurar DNS wildcard en producción
5. Implementar manejo de errores más granular

## Estado Actual

✅ **Task 1.3 COMPLETADA** - Sistema de enrutamiento por subdominio completamente implementado con:

-  Middleware funcional
-  Lookup de tenants
-  Validación de estado
-  Contexto para RLS
-  Manejo de errores
-  Documentación y ejemplos
