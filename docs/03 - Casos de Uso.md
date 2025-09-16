### **Documento de Especificación de Casos de Uso**
## Proyecto Reasy - Sistema SaaS Multi-Tenant de Gestión de Reservas

| Campo | Valor |
| :--- | :--- |
| **Proyecto** | Reasy - Sistema de Gestión de Reservas |
| **Versión** | **2.0 (Versión Consolidada)** |
| **Fecha** | 16 de Septiembre, 2025 |
| **Metodología** | Rational Unified Process (RUP) |
| **Fase** | Elaboración |
| **Estado** | **Aprobado para Desarrollo** |

---

### **1. Introducción**

Este documento proporciona una descripción detallada de los Casos de Uso del sistema Reasy, alineada con el Documento de Requisitos de Software v2.0. Cada caso de uso representa una funcionalidad específica y describe el flujo de eventos, tanto el principal como los alternativos y de excepción. Este modelo sirve como un contrato funcional entre los stakeholders y el equipo de desarrollo.

### **2. Índice de Casos de Uso**

#### **2.1 Casos de Uso de la Plataforma**
*   **UC-PL-01:** Registrar y Aprobar Nuevo Negocio
*   **UC-PL-02:** Administrar Planes de Suscripción

#### **2.2 Casos de Uso del Tenant (Negocio)**
*   **UC-TN-01:** Realizar Configuración Inicial del Negocio (Onboarding Wizard)
*   **UC-TN-02:** Administrar Catálogo de Servicios y Asignar Personal
*   **UC-TN-03:** Invitar y Administrar Personal (Staff)

#### **2.3 Casos de Uso del Staff**
*   **UC-ST-01:** Administrar Horario y Disponibilidad Personal

#### **2.4 Casos de Uso del Cliente Final**
*   **UC-CU-01:** Reservar una Cita (Cliente Invitado)
*   **UC-CU-02:** Gestionar Reserva Existente

---

### **3. Especificación Detallada de Casos de Uso**

#### **UC-PL-01: Registrar y Aprobar Nuevo Negocio**
*(Este caso de uso no sufre cambios significativos y se mantiene como en la versión anterior).*

---

#### **UC-TN-02: Administrar Catálogo de Servicios y Asignar Personal**

| Campo | Descripción |
| :--- | :--- |
| **ID** | UC-TN-02 |
| **Actores** | Tenant Admin, Sistema |
| **Descripción** | El Administrador del Negocio crea o modifica un servicio y asigna qué miembros del staff están cualificados para realizarlo. |
| **Prioridad** | Crítica |
| **Precondiciones** | - El **Tenant Admin** tiene una sesión activa en el dashboard de su tenant (`[slug].midominio.com`). <br> - Existen al menos un miembro del staff creado en el sistema. |
| **Postcondiciones** | **Éxito:** El servicio es creado/actualizado en `tnt_services` y se crean/actualizan las asociaciones en `tnt_service_staff`. La disponibilidad para este servicio se podrá calcular correctamente. |

**Flujo Principal (Camino Feliz):**
1.  El **Tenant Admin** navega a la sección "Servicios" del dashboard.
2.  El **Tenant Admin** hace clic en "Crear Nuevo Servicio" o edita uno existente.
3.  El **Tenant Admin** completa los detalles básicos del servicio (nombre, duración, precio, etc.).
4.  En la sección "Personal Asignado", el **Sistema** muestra una lista de todos los miembros del staff (`tnt_resources` de tipo `staff`).
5.  El **Tenant Admin** selecciona los checkboxes junto a los nombres del staff que pueden realizar este servicio.
6.  El **Tenant Admin** guarda los cambios.
7.  El **Sistema** valida los datos.
8.  El **Sistema** crea o actualiza el registro en `tnt_services`.
9.  El **Sistema** sincroniza la tabla `tnt_service_staff`:
    a. Elimina las asociaciones existentes para este servicio que ya no están seleccionadas.
    b. Crea nuevas asociaciones para los miembros del staff recién seleccionados.
10. El **Sistema** muestra un mensaje de éxito.

**Flujos Alternativos y Excepciones:**
*   **7a. Validación Falla:** Si falta un campo obligatorio, el **Sistema** muestra un error y no permite guardar.
*   **9a. Error de Base de Datos:** Si ocurre un error al guardar, el **Sistema** revierte la transacción completa y muestra un mensaje de error genérico.

---

#### **UC-TN-03: Invitar y Administrar Personal (Staff)**

| Campo | Descripción |
| :--- | :--- |
| **ID** | UC-TN-03 |
| **Actores** | Tenant Admin, Sistema |
| **Descripción** | El Administrador del Negocio invita a un nuevo miembro del personal, lo que consume un "asiento" de su plan de suscripción. |
| **Prioridad** | Alta |
| **Precondiciones** | - El **Tenant Admin** tiene una sesión activa en el dashboard de su tenant. |
| **Postcondiciones** | **Éxito:** Se crea una invitación y, tras ser aceptada, un nuevo registro en `tnt_users`. El contador de uso del plan se incrementa. <br> **Fallo:** No se crea la invitación si se excede el límite del plan. |

**Flujo Principal (Camino Feliz):**
1.  El **Tenant Admin** navega a la sección "Personal".
2.  El **Tenant Admin** hace clic en "Invitar Personal".
3.  El **Sistema**, antes de mostrar el formulario, invoca la función `check_tenant_limit(tenant_id, 'max_users')`.
4.  La función retorna `true`, indicando que hay espacio disponible en el plan.
5.  El **Sistema** muestra el formulario de invitación (email, rol).
6.  El **Tenant Admin** completa y envía el formulario.
7.  El **Sistema** crea la invitación y envía el email correspondiente.
8.  (Flujo posterior) Cuando el usuario acepta la invitación, el **Sistema** crea el `tnt_user` e invoca `update_tenant_usage(tenant_id, 'max_users', 1)`.

**Flujos Alternativos y Excepciones:**
*   **3a. Límite del Plan Excedido:** La función `check_tenant_limit` retorna `false`. El **Sistema** no muestra el formulario de invitación. En su lugar, muestra un mensaje informativo: "Has alcanzado el límite de X usuarios de tu plan. Por favor, actualiza tu suscripción para añadir más personal."

---

#### **UC-CU-01: Reservar una Cita (Cliente Invitado) - VERSIÓN ACTUALIZADA**

| Campo | Descripción |
| :--- | :--- |
| **ID** | UC-CU-01 |
| **Actores** | Cliente Invitado, Sistema, Servicio de Email, Gateway de Pago |
| **Descripción** | Un cliente sin cuenta previa reserva un servicio a través de la interfaz pública de un tenant, con un mecanismo de bloqueo para prevenir dobles reservas. |
| **Prioridad** | Crítica |
| **Precondiciones** | - El tenant tiene al menos un servicio activo con staff asignado y horarios configurados. <br> - La interfaz de reserva del tenant es accesible públicamente. |
| **Postcondiciones** | **Éxito:** Se crea un registro en `tnt_bookings` con estado `confirmed`. Se elimina el `tnt_booking_lock`. Se envía una notificación de confirmación. <br> **Fallo:** No se crea ninguna reserva. El `tnt_booking_lock` es liberado (ya sea por finalización o por expiración). |

**Flujo Principal (Camino Feliz):**
1.  El **Cliente Invitado** accede a la página de reservas del tenant.
2.  El **Cliente Invitado** selecciona un servicio del catálogo.
3.  El **Sistema** consulta la disponibilidad:
    a. Primero busca en la tabla `tnt_availability_cache`.
    b. Si no hay caché válido, ejecuta el cálculo completo, considerando horarios, excepciones, reservas existentes y **slots bloqueados en `tnt_booking_locks`**.
    c. Muestra un calendario con los slots disponibles.
4.  El **Cliente Invitado** selecciona un día y un slot de hora.
5.  **El Sistema intenta crear un registro en `tnt_booking_locks` para ese recurso, slot y la sesión actual del cliente.**
6.  La creación del `lock` es exitosa. El **Sistema** avanza a la siguiente pantalla y establece un temporizador de 10 minutos en la UI.
7.  El **Cliente Invitado** completa el formulario con sus datos de contacto.
8.  (Si se requiere depósito) El **Sistema** redirige al **Gateway de Pago**.
9.  (Si se requiere depósito) El **Gateway de Pago** procesa la transacción y notifica al **Sistema** del éxito.
10. El **Sistema** realiza la confirmación final en una única transacción:
    a. Crea el registro `tnt_bookings` con estado `confirmed`.
    b. Crea el registro `tnt_customers` de tipo `guest`.
    c. **Elimina el registro correspondiente de `tnt_booking_locks`**.
11. El **Sistema** muestra una página de confirmación de la reserva.
12. El **Sistema** invoca al **Servicio de Email** para enviar notificaciones de confirmación.
13. **(En segundo plano) El Sistema invalida el caché de disponibilidad** para el recurso y día afectados, debido a la nueva reserva.

**Flujos Alternativos y Excepciones:**
*   **5a. Falla la creación del `lock`:** Ocurre un error de violación de unicidad porque otro cliente acaba de bloquear o reservar ese mismo slot. El **Sistema** no avanza. En su lugar, muestra un mensaje inmediato al **Cliente Invitado**: "Lo sentimos, este horario acaba de ser ocupado. Por favor, selecciona otro." y refresca la vista de disponibilidad.
*   **6a. El cliente abandona o el temporizador de 10 minutos expira:** El `tnt_booking_lock` permanece en la base de datos. Un job programado (`pg_cron`) lo eliminará después de su `expires_at`, liberando el slot para otros clientes. El cliente que abandonó el flujo verá un mensaje de "sesión expirada" si intenta continuar.
*   **9a. El pago falla:** El **Sistema** informa del error. El `tnt_booking_lock` se mantiene activo, permitiendo al cliente reintentar el pago hasta que el temporizador de 10 minutos expire.

---
*(El resto de Casos de Uso, como UC-ST-01 o UC-CU-02, no requieren cambios sustanciales, pero se benefician de la mayor claridad y robustez de los mecanismos subyacentes definidos aquí).*