### **Roadmap de Desarrollo del Proyecto Reasy**

Este documento describe el plan de desarrollo para la aplicación Reasy. Las tareas están agrupadas en sprints lógicos y diseñadas para entregar valor de forma incremental.

---

### **Resumen del Progreso**

-  **Progreso General del Proyecto:** 7/39 (18%)
-  **Fase 1: MVP Funcional:** 7/25 (28%)
-  **Fase 2: Sistema Completo:** 0/8 (0%)
-  **Fase 3: Enterprise Features:** 0/6 (0%)

---

### **Fase 1: MVP Funcional (Meses 1-4)**

**Objetivo:** Lanzar una versión funcional y robusta del sistema capaz de gestionar el ciclo de vida completo de las reservas para los primeros tenants.

**Progreso de Fase 1:** 7/25 (28%)

---

#### **Sprint 1: Fundación y Arquitectura Multi-Tenant (2 semanas)**

**Progreso:** 7/7 (100%)
**Objetivo:** Establecer las bases técnicas del proyecto, asegurando que la arquitectura multi-tenant funcione correctamente.

-  [x] **Tarea 1.1:** Configurar proyecto Next.js 14+ con TypeScript, ESLint, Prettier y Tailwind CSS.
-  [x] **Tarea 1.2:** Configurar proyecto de Supabase, definir variables de entorno y generar tipos iniciales.
-  [x] **Tarea 1.3 (CRÍTICO):** Implementar enrutamiento por subdominio (`*.reasy.app` y `admin.reasy.app`) a nivel de Vercel y middleware en Next.js.
   -  **Completado:** Sistema completo de enrutamiento por subdominio implementado:
      -  Middleware base que enruta correctamente peticiones de admin y tenant
      -  Funciones de lookup de tenant por slug (`/lib/tenants/lookup.ts`)
      -  Funciones específicas para middleware (`/lib/tenants/middleware.ts`)
      -  Funciones de contexto para Server Actions (`/lib/tenants/context.ts`)
      -  Validación de slugs reservados y verificación de estado de tenant
      -  Redirección automática para tenants inactivos o no encontrados
      -  Headers para transferir contexto de tenant entre capas
-  [x] **Tarea 1.4:** Implementar el esquema de la base de datos para tablas globales (`platform_users`, `tenants`, `subscription_plans`, `business_registration_requests`, `tenant_usage`).
   -  **Completado:** El archivo `docs/04 - Model.md` ha sido actualizado y consolidado para servir como la fuente de verdad del esquema SQL, incluyendo todas las tablas globales y de tenant.
-  [x] **Tarea 1.5:** Desarrollar el flujo de autenticación para `platform_users` en el portal `admin`.
   -  **Completado:** Se ha implementado completamente el sistema de autenticación y autorización para el portal admin, incluyendo:
      -  Verificación de rol en el middleware para proteger rutas automáticamente
      -  Funciones helper reutilizables para verificar roles (`/lib/auth/platform.ts`)
      -  Función de protección de rutas (`/lib/auth/admin-guard.ts`)
      -  Server Actions actualizadas con verificación de rol
      -  Dashboard admin que muestra información del usuario autorizado
      -  Solo usuarios con rol 'super_admin' o 'admin' pueden acceder al portal
      -  Usuarios sin permisos son redirigidos automáticamente al login
-  [x] **Tarea 1.6:** Implementar el flujo de registro y aprobación de nuevos tenants (UC-PL-01).
   -  **Completado:** Se ha implementado completamente el flujo de registro y aprobación de tenants:
      -  Formulario de signup funcional conectado a Server Actions (`/src/app/signup/page.tsx`)
      -  Server Actions completas para gestión de solicitudes (`/src/actions/tenant.ts`)
      -  Dashboard admin actualizado con datos reales de la base de datos
      -  Componente de acciones para aprobar/rechazar solicitudes
      -  Cliente Supabase admin para operaciones privilegiadas
      -  Validaciones del lado cliente y servidor
      -  Manejo de estados de éxito/error con notificaciones
      -  Creación automática de tenant, usuario Auth y registro tnt_users al aprobar
      -  Script de datos iniciales para planes de suscripción
-  [x] **Tarea 1.7:** Configurar RLS básicas y la función `get_current_tenant_id()` para que se popule desde el middleware.
   -  **Completado:** Se ha implementado completamente el sistema de Row Level Security (RLS):
      -  Funciones RPC para establecer contexto: `set_app_config()`, `set_current_tenant_id()`
      -  Función `get_current_tenant_id()` funcional para políticas RLS
      -  Middleware actualizado para establecer contexto de tenant en cada request
      -  Server Actions mejoradas con establecimiento de contexto RLS
      -  Políticas "Tenant Isolation" aplicables a todas las tablas `tnt_*`
      -  Script de configuración inicial (`/scripts/setup-rls.sql`)
      -  Dashboard de testing para verificar RLS (`/admin/rls-test`)
      -  Funciones de prueba para validar aislamiento entre tenants
      -  Transferencia segura de contexto via headers entre capas
      -  Fallbacks y manejo de errores robusto

---

#### **Sprint 2: Gestión Básica del Tenant (3 semanas)**

**Progreso:** 0/7 (0%)
**Objetivo:** Permitir que un tenant configure los elementos esenciales de su negocio.

-  [ ] **Tarea 2.1:** Implementar el esquema de DB para `tnt_users`, `tnt_businesses`, `tnt_locations`, `tnt_services`.
-  [ ] **Tarea 2.2:** Desarrollar el CRUD completo para la gestión de Servicios (`tnt_services`).
-  [ ] **Tarea 2.3:** Desarrollar el CRUD completo para la gestión de Ubicaciones (`tnt_locations`).
-  [ ] **Tarea 2.4:** Implementar el flujo de invitación y gestión de Personal (`tnt_users`).
-  [ ] **Tarea 2.5 (CRÍTICO):** Implementar la lógica de validación de límites de plan (`check_tenant_limit` y triggers) para usuarios y ubicaciones.
-  [ ] **Tarea 2.6:** Desarrollar el dashboard principal del tenant, mostrando un resumen del negocio.
-  [ ] **Tarea 2.7:** Implementar el wizard de onboarding guiado para el primer login del tenant (UC-TN-01).

---

#### **Sprint 3: Motor de Disponibilidad y Reservas (4 semanas)**

**Progreso:** 0/6 (0%)
**Objetivo:** Construir el corazón funcional del sistema: el cálculo de disponibilidad y la creación de reservas. Este es el sprint más complejo.

-  [ ] **Tarea 3.1:** Implementar el esquema de DB para `tnt_resources`, `tnt_schedules`, `tnt_schedule_exceptions`, `tnt_bookings`, y la tabla de unión `tnt_service_staff`.
-  [ ] **Tarea 3.2:** Desarrollar la interfaz para que el Staff gestione sus horarios y excepciones (UC-ST-01).
-  [ ] **Tarea 3.3:** Desarrollar la interfaz para asociar Staff con Servicios (UC-TN-02).
-  [ ] **Tarea 3.4 (CRÍTICO):** Implementar el algoritmo del motor de disponibilidad en la API, considerando todos los requisitos (horarios, excepciones, staff asignado, reservas existentes).
-  [ ] **Tarea 3.5 (CRÍTICO):** Implementar el mecanismo de bloqueo de reservas (`tnt_booking_locks`) y su integración en el flujo de reserva (RF-3.3).
-  [ ] **Tarea 3.6:** Crear la primera versión del widget de reserva, que consume el motor de disponibilidad y permite crear una reserva completa (UC-CU-01).

---

#### **Sprint 4: Pagos y Optimización de Rendimiento (3 semanas)**

**Progreso:** 0/5 (0%)
**Objetivo:** Integrar los pagos y asegurar que el sistema cumple con los requisitos de rendimiento del MVP.

-  [ ] **Tarea 4.1:** Implementar el esquema de DB para `tnt_payments` y `tnt_refunds`.
-  [ ] **Tarea 4.2:** Integrar Stripe Connect para procesar depósitos o pagos completos durante el flujo de reserva.
-  [ ] **Tarea 4.3 (CRÍTICO):** Implementar la estrategia de caché para el motor de disponibilidad (`tnt_availability_cache`).
-  [ ] **Tarea 4.4 (CRÍTICO):** Implementar los triggers de invalidación de caché para garantizar la consistencia de los datos.
-  [ ] **Tarea 4.5:** Realizar pruebas de carga en el endpoint de disponibilidad para validar el cumplimiento de RNF-1.2 (< 2s).

---

### **Fase 2: Sistema Completo (Post-MVP)**

**Objetivo:** Enriquecer el producto con funcionalidades de comunicación, análisis y gestión avanzada.

**Progreso de Fase 2:** 0/8 (0%)

---

#### **Sprint 5: Sistema de Notificaciones y Comunicaciones**

**Progreso:** 0/4 (0%)

-  [ ] **Tarea 5.1:** Implementar esquema de DB para `tnt_notification_templates` y `tnt_notifications`.
-  [ ] **Tarea 5.2:** Integrar un servicio de terceros (ej. SendGrid) para el envío de emails transaccionales.
-  [ ] **Tarea 5.3:** Desarrollar un sistema basado en eventos para disparar notificaciones (reserva creada, recordatorio 24h, cancelación).
-  [ ] **Tarea 5.4:** Crear una interfaz para que los tenants personalicen sus plantillas de notificación.

---

#### **Sprint 6: Reportes y Políticas de Negocio**

**Progreso:** 0/4 (0%)

-  [ ] **Tarea 6.1:** Diseñar y desarrollar un dashboard de analíticas básicas para tenants (ingresos, total de reservas, ocupación por staff).
-  [ ] **Tarea 6.2:** Implementar esquema de DB para `tnt_cancellation_policies` y `tnt_refunds`.
-  [ ] **Tarea 6.3:** Desarrollar la lógica para aplicar políticas de cancelación durante el proceso de cancelación de una reserva.
-  [ ] **Tarea 6.4:** Implementar la gestión de reembolsos (parciales/totales) a través de Stripe.

---

### **Fase 3: Enterprise Features (Futuro)**

**Objetivo:** Añadir funcionalidades de alto valor para clientes más grandes y abrir la plataforma a integraciones.

**Progreso de Fase 3:** 0/6 (0%)

---

#### **Sprint 7: Integraciones Externas**

**Progreso:** 0/3 (0%)

-  [ ] **Tarea 7.1:** Implementar esquema de DB para `tnt_integrations`.
-  [ ] **Tarea 7.2:** Desarrollar la integración con Google Calendar para sincronización bidireccional de agendas.
-  [ ] **Tarea 7.3:** Investigar y (si es viable) desarrollar la integración con Outlook Calendar.

---

#### **Sprint 8: API Pública y Personalización Avanzada**

**Progreso:** 0/3 (0%)

-  [ ] **Tarea 8.1:** Diseñar y documentar una API pública (RESTful) para que terceros puedan interactuar con los datos de un tenant (con su permiso).
-  [ ] **Tarea 8.2:** Implementar un sistema de autenticación por API keys para la API pública.
-  [ ] **Tarea 8.3 (POST-MVP):** Implementar el esquema de DB y la UI para el constructor de formularios dinámicos (RF-2.3).
