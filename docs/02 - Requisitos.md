### **Documento de Requisitos de Software (SRS)**
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

#### **1.1 Propósito**
Este documento especifica los requisitos funcionales, no funcionales y de interfaz para el sistema Reasy. Está destinado a servir como la fuente de verdad para los equipos de desarrollo, QA y gestión de producto, asegurando que el sistema final cumpla con los objetivos de negocio y las expectativas de los stakeholders definidos en el Documento de Visión v1.1.

#### **1.2 Alcance**
El sistema Reasy es una plataforma SaaS multi-tenant que permite a los negocios gestionar sus operaciones de reserva. El alcance de este documento cubre:
*   La arquitectura multi-tenant con acceso por subdominio y aislamiento de datos a nivel de base de datos.
*   La gestión de planes de suscripción y la aplicación estricta de límites asociados.
*   El ciclo de vida completo de una reserva, incluyendo mecanismos de prevención de concurrencia.
*   La administración de la plataforma para los operadores de Reasy.
*   Los requisitos de rendimiento, seguridad y usabilidad, incluyendo estrategias de caché.

#### **1.3 Referencias**
*   Documento de Visión v1.1
*   Documento de Especificación de Casos de Uso v1.0
*   Documento de Diseño de Software v1.0 (Pendiente de creación)

---

### **2. Descripción General**

#### **2.1 Perspectiva del Producto**
Reasy es un sistema cloud-native diseñado para ser escalable y seguro desde su concepción. Su arquitectura permite a cada negocio (tenant) operar de forma independiente en su propio subdominio (`[slug].midominio.com`), mientras que la administración central se maneja a través de un portal dedicado (`admin.midominio.com`). El sistema se diferenciará por su flexibilidad para adaptarse a diferentes tamaños de negocio a través de un modelo de planes escalonado.

#### **2.2 Clases de Usuario y Características**
(Se mantienen las mismas clases definidas en el SRS original: Usuarios de Plataforma, Usuarios de Tenant, Clientes).

---

### **3. Requisitos Funcionales Específicos**

#### **RF-1: Arquitectura y Gestión de Tenants**

*   **RF-1.1: Enrutamiento por Subdominio.** El sistema debe resolver las peticiones basadas en el subdominio del host.
    *   **RF-1.1.1:** Las peticiones a `admin.midominio.com` deben dirigir al portal de administración de la plataforma.
    *   **RF-1.1.2:** Las peticiones a `[slug].midominio.com` deben identificar al tenant asociado al `slug` y cargar el dashboard de administración de dicho tenant.
    *   **RF-1.1.3:** Si el `slug` no corresponde a un tenant activo, el sistema debe redirigir a una página de error 404 o a la landing page principal.

*   **RF-1.2: Registro de Nuevo Negocio (Onboarding).** El sistema debe permitir el registro de nuevos tenants.
    *   **RF-1.2.1:** Un usuario prospecto debe poder solicitar la creación de un negocio a través de un formulario en la landing page principal.
    *   **RF-1.2.2:** La solicitud debe generar un registro de `business_registration_request` que un `Platform Admin` debe aprobar o rechazar.
    *   **RF-1.2.3:** Tras la aprobación, el sistema debe crear automáticamente: un nuevo registro de `tenant` con un `slug` único, una cuenta de usuario para el `owner`, y el subdominio correspondiente.

*   **RF-1.3: Gestión de Planes y Límites.** El sistema debe hacer cumplir los límites definidos en el plan de suscripción de cada tenant.
    *   **RF-1.3.1:** El sistema debe definir al menos tres niveles de planes (ej. Monousuario, Multiusuario, Multisucursal) con límites específicos para `max_users`, `max_locations` y acceso a features.
    *   **RF-1.3.2:** El sistema debe impedir a nivel de base de datos la creación de nuevas entidades (ej. usuarios, sucursales) si se excede el límite del plan actual del tenant. La UI debe mostrar un mensaje informativo al usuario.
    *   **RF-1.3.3:** El sistema debe proveer una interfaz para que los `Platform Admins` gestionen los planes y para que los `Tenant Owners` puedan solicitar un cambio de plan.
    *   **RF-1.3.4:** El sistema debe registrar el uso actual de cada métrica limitada (ej. número de usuarios) por tenant para una validación eficiente.

#### **RF-2: Gestión del Negocio (Tenant)**

*   **RF-2.1: Administración de Servicios y Personal.** El `Tenant Admin` debe poder gestionar el catálogo de servicios y su asignación.
    *   **RF-2.1.1:** El sistema debe permitir crear, editar y archivar servicios, definiendo su nombre, descripción y duración en minutos.
    *   **RF-2.1.2:** El sistema debe permitir asociar explícitamente uno o varios miembros del `Staff` a cada servicio que estén cualificados para prestar, a través de una tabla de relación.

*   **RF-2.2: Administración de Horarios del Personal (Staff).** El personal debe poder gestionar su disponibilidad.
    *   **RF-2.2.1:** El sistema debe permitir que cada miembro del `Staff` defina su horario de trabajo recurrente (ej. Lunes a Viernes de 9 a 5).
    *   **RF-2.2.2:** El sistema debe permitir que cada miembro del `Staff` registre excepciones puntuales a su horario (ej. vacaciones, citas médicas, días festivos).

*   **RF-2.3: Constructor de Formularios Dinámicos.**
    *   **Prioridad:** Baja (Post-MVP).
    *   **Descripción:** El `Tenant Admin` debe poder añadir campos personalizados al formulario de reserva.
    *   **RF-2.3.1:** El sistema debe proveer una interfaz para definir campos personalizados asociados a servicios, especificando tipo de dato, etiqueta y reglas de validación.
    *   **RF-2.3.2:** Los datos recolectados de estos campos deben almacenarse de forma estructurada y asociarse a la reserva correspondiente.

#### **RF-3: Motor de Disponibilidad y Reservas**

*   **RF-3.1: Cálculo de Disponibilidad Dinámica.** El sistema debe calcular y mostrar los slots de tiempo disponibles en tiempo real.
    *   **RF-3.1.1:** El algoritmo debe considerar simultáneamente: el horario base del `Staff`, las excepciones, las reservas existentes y la duración del servicio.
    *   **RF-3.1.2:** La consulta de disponibilidad para un servicio debe basarse en la lista de `Staff` explícitamente asociados a dicho servicio (según RF-2.1.2).

*   **RF-3.2: Flujo de Creación de Reservas.** El sistema debe permitir a los clientes finales crear reservas de forma segura.
    *   **RF-3.2.1:** El cliente debe poder acceder a la interfaz de reserva a través de un widget embebible o una landing page pública del tenant.
    *   **RF-3.2.2:** El flujo debe consistir en: seleccionar servicio, ver disponibilidad, elegir un slot, proveer datos de contacto, y realizar el pago del depósito si es requerido.
    *   **RF-3.2.3:** El sistema debe soportar reservas tanto para clientes registrados como para invitados (guest).

*   **RF-3.3: Prevención de Concurrencia en Reservas (Booking Lock).**
    *   **Prioridad:** Crítica.
    *   **Descripción:** El sistema debe implementar un mecanismo de bloqueo a nivel de base de datos que impida que dos usuarios reserven el mismo slot de tiempo simultáneamente.
    *   **RF-3.3.1:** Al seleccionar un slot de tiempo, el sistema debe crear un bloqueo temporal (`booking_lock`) para ese recurso y slot, asociado a la sesión del usuario.
    *   **RF-3.3.2:** El bloqueo debe expirar automáticamente tras un período predefinido (ej. 10 minutos) si la reserva no se completa.
    *   **RF-3.3.3:** La consulta de disponibilidad debe excluir los slots que tengan un bloqueo activo.

---

### **4. Requisitos No Funcionales**

#### **RNF-1: Rendimiento**
*   **RNF-1.1: Tiempo de Respuesta de API:** p95 < 300ms para endpoints CRUD.
*   **RNF-1.2: Cálculo de Disponibilidad:** La consulta de disponibilidad debe retornar en **< 2 segundos** para un rango de 30 días. Para lograr este objetivo, el sistema debe implementar una estrategia de caché.
    *   **RNF-1.2.1:** El sistema debe almacenar en caché los resultados de los cálculos de disponibilidad para combinaciones de recurso, servicio y fecha.
    *   **RNF-1.2.2:** El caché debe invalidarse automáticamente y de forma inmediata cuando ocurra cualquier evento que afecte la disponibilidad (nueva reserva, cancelación, cambio de horario, etc.).

#### **RNF-2: Escalabilidad**
*   **RNF-2.1: Tenants Concurrentes:** El sistema debe estar diseñado para soportar hasta 10,000 tenants activos sin degradación del rendimiento.
*   **RNF-2.2: Peticiones por Subdominio:** La arquitectura debe poder escalar horizontalmente para manejar picos de tráfico en tenants populares.

#### **RNF-3: Seguridad**
*   **RNF-3.1: Aislamiento de Datos (Multi-tenancy):** El sistema debe garantizar a nivel de base de datos que un tenant no pueda bajo ninguna circunstancia acceder, modificar o conocer la existencia de los datos de otro tenant. Esto se implementará a través de Políticas de Row Level Security (RLS) en todas las tablas de tenant.
*   **RNF-3.2: Autenticación y Autorización:**
    *   El acceso al portal `admin.midominio.com` debe estar restringido a usuarios de la plataforma.
    *   El acceso a `[slug].midominio.com` debe estar restringido a usuarios de ese tenant específico.
    *   El sistema debe implementar un control de acceso basado en roles (RBAC) dentro de cada tenant.

#### **RNF-4: Usabilidad**
*   **RNF-4.1: Diseño Responsivo:** Todas las interfaces (dashboards y widgets) deben ser completamente funcionales y visualmente correctas en dispositivos móviles (viewport >= 320px) y de escritorio.
*   **RNF-4.2: Onboarding Guiado:** El primer inicio de sesión de un `Tenant Owner` debe activar un wizard que lo guíe a través de la configuración inicial de su negocio.

---

### **5. Matriz de Trazabilidad de Requisitos vs. Features**

| Requisito | Característica Relacionada (del Doc. de Visión) | Prioridad |
| :--- | :--- | :--- |
| RF-1.1 | FEAT-001 | Crítica |
| RF-1.2 | FEAT-001, FEAT-002 | Crítica |
| RF-1.3 | FEAT-002 | Alta |
| RF-2.1 | FEAT-003, FEAT-007 | Crítica |
| RF-2.2 | FEAT-007 | Crítica |
| RF-2.3 | FEAT-008 | Baja (Post-MVP) |
| RF-3.1 | FEAT-004 | Crítica |
| RF-3.2 | FEAT-005, FEAT-006 | Crítica |
| **RF-3.3** | FEAT-004, FEAT-005 | **Crítica** |
| RNF-1.2 | FEAT-004 | Crítica |
| RNF-3.1 | FEAT-001 | Crítica |

---
### **6. Criterios de Validación**

*   **Validación de RF-1.3:** Se creará un tenant con un plan que limita a 2 usuarios. Tras crear el segundo usuario, el botón "Invitar Usuario" debe aparecer deshabilitado o, al intentar usarlo, debe mostrar un error claro indicando la necesidad de actualizar el plan. Un intento de inserción directa en la DB por un usuario no-superuser debe fallar.
*   **Validación de RF-3.3:** Iniciar dos sesiones de navegador simultáneas. En ambas, seleccionar el mismo servicio, recurso y slot de tiempo. La primera sesión que haga clic en el slot debe proceder al formulario de datos. La segunda sesión debe ver inmediatamente que el slot ya no está disponible o recibir un error al intentar seleccionarlo.
*   **Validación de RNF-1.2:** Tras la implementación del caché, el primer acceso a la disponibilidad de un recurso puede tardar hasta 2 segundos. Los accesos subsecuentes a la misma vista (sin que hayan ocurrido cambios) deben cargar en < 300ms. Tras crear una nueva reserva, la siguiente carga de la disponibilidad debe reflejar el cambio correctamente.

---
**Fin del Documento de Requisitos de Software**