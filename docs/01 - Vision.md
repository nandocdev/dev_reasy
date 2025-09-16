### **Documento de Visión**
## Proyecto Reasy - Sistema SaaS Multi-Tenant de Gestión de Reservas

| Campo | Valor |
| :--- | :--- |
| **Proyecto** | Reasy - Sistema de Gestión de Reservas |
| **Versión** | 1.1 |
| **Fecha** | 16 de Septiembre, 2025 |
| **Metodología** | Rational Unified Process (RUP) |
| **Fase** | Incepción |
| **Estado** | Borrador para Revisión |

---

### **1. Introducción**

#### **1.1 Propósito**
Este documento proporciona una visión general de alto nivel del proyecto Reasy. Su objetivo es definir las necesidades del negocio, las características clave del producto y los criterios de aceptación desde la perspectiva de los stakeholders. Sirve como el principal punto de acuerdo entre el equipo de desarrollo y los stakeholders del negocio, guiando la dirección del proyecto a lo largo de su ciclo de vida.

#### **1.2 Alcance**
El proyecto Reasy consiste en el diseño, desarrollo y despliegue de una plataforma Software as a Service (SaaS) multi-tenant. El sistema permitirá a negocios basados en servicios (desde profesionales independientes hasta empresas con múltiples sucursales) gestionar su agenda, reservas de clientes, personal, servicios y pagos de manera centralizada y eficiente. El alcance incluye tanto el dashboard de administración para los negocios (tenants) y la plataforma, como las interfaces públicas (widgets y landings) para los clientes finales.

#### **1.3 Definiciones, Acrónimos y Abreviaturas**
*   **SaaS:** Software as a Service.
*   **Tenant:** Una organización cliente (un negocio) que utiliza la plataforma Reasy. Cada tenant opera de forma aislada de los demás.
*   **Plataforma:** La infraestructura y aplicación central de Reasy, administrada por el equipo de Reasy.
*   **RLS:** Row Level Security (Seguridad a Nivel de Fila), mecanismo de base de datos para garantizar el aislamiento de datos entre tenants.
*   **MVP:** Minimum Viable Product (Producto Mínimo Viable).

---

### **2. Posicionamiento**

#### **2.1 Oportunidad de Negocio**
El mercado de software de gestión para Pequeñas y Medianas Empresas (PYMEs) de servicios está saturado de soluciones que a menudo son: a) demasiado simples y carecen de escalabilidad (ej. Calendly básico), o b) parte de sistemas monolíticos más grandes y costosos que son difíciles de adaptar (ej. módulos de ERPs).

La oportunidad para Reasy reside en ofrecer una solución "goldilocks": suficientemente simple para que un profesional independiente pueda empezar en minutos, pero arquitectónicamente robusta y flexible para escalar con un negocio a múltiples usuarios, servicios y sucursales. La arquitectura nativa en la nube, multi-tenant y con un enfoque API-first permitirá una mayor personalización, seguridad y capacidad de integración que las alternativas existentes.

#### **2.2 Planteamiento del Problema**
| El Problema de | Ineficiencia operativa en negocios de servicios. |
| :--- | :--- |
| **Afecta a** | Dueños de negocios, administradores, personal (staff) y clientes finales. |
| **Cuyo impacto es** | Pérdida de ingresos por no-shows, doble reserva, tiempo administrativo excesivo, mala experiencia del cliente, y falta de visibilidad sobre el rendimiento del negocio. |
| **Una solución exitosa sería** | Una plataforma centralizada que automatice el ciclo de vida de la reserva, desde el descubrimiento de disponibilidad hasta el pago y la comunicación post-servicio, adaptándose a las reglas específicas de cada negocio. |

#### **2.3 Declaración de Posicionamiento del Producto**
**PARA** negocios de servicios que buscan optimizar su gestión y mejorar la experiencia de sus clientes.
**QUIENES** necesitan una herramienta flexible y escalable para administrar sus citas, personal y pagos.
**EL** Reasy
**ES UN** sistema de gestión de reservas SaaS.
**QUE** provee un motor de disponibilidad en tiempo real, procesamiento de pagos integrado, y herramientas de comunicación automatizadas, todo dentro de una arquitectura multi-tenant segura.
**A DIFERENCIA DE** soluciones como Acuity Scheduling o Square Appointments,
**NUESTRO PRODUCTO** ofrece una separación arquitectónica limpia entre la plataforma y los tenants a través de subdominios, una personalización más profunda (ej. campos de formulario dinámicos) y planes que se adaptan verdaderamente al crecimiento del negocio, desde un solo usuario hasta múltiples sucursales.

---

### **3. Descripción de Stakeholders y Usuarios**

#### **3.1 Perfiles de Usuario Clave**

| Perfil de Usuario | Descripción | Objetivos / Intereses |
| :--- | :--- | :--- |
| **Platform Admin** | Empleado de Reasy. Gestiona la salud general del SaaS. | Monitorear el estado del sistema, aprobar nuevos tenants, gestionar suscripciones, dar soporte de alto nivel. |
| **Dueño/Admin del Negocio (Tenant Owner/Admin)** | El cliente principal de Reasy. Gestiona su negocio a través de la plataforma. | Configurar servicios y precios, gestionar personal y sucursales, ver reportes, maximizar la ocupación y reducir la carga administrativa. |
| **Personal (Staff)** | Empleado del tenant. Presta los servicios a los clientes finales. | Consultar su agenda, gestionar sus horarios y disponibilidad, atender sus citas, comunicarse con los clientes. |
| **Cliente Final** | Cliente del tenant. Reserva los servicios. | Encontrar disponibilidad fácilmente, reservar y pagar en línea, recibir recordatorios, gestionar sus propias citas. |

---

### **4. Visión General del Producto**

#### **4.1 Perspectiva del Producto**
Reasy es un producto nuevo e independiente. Se construirá sobre una arquitectura serverless moderna (Vercel/Next.js + Supabase/PostgreSQL) para garantizar la escalabilidad, la seguridad y un rápido ciclo de desarrollo. Se integrará con servicios de terceros líderes en su categoría (ej. Stripe para pagos, SendGrid/Twilio para comunicaciones) pero no dependerá de ningún sistema preexistente.

#### **4.2 Suposiciones y Dependencias**
*   **Suposiciones:**
    *   Los administradores de los tenants poseen conocimientos informáticos básicos.
    *   Existe una conexión a internet estable tanto para el personal del tenant como para los clientes finales.
*   **Dependencias:**
    *   Disponibilidad y rendimiento de los servicios de Supabase (Base de datos, Auth, RLS).
    *   Disponibilidad de la plataforma de hosting (Vercel).
    *   Disponibilidad y políticas de las APIs de terceros (Stripe, proveedores de email/SMS).
    *   La configuración correcta de un DNS con wildcard es crítica para el funcionamiento del sistema.

#### **4.3 Características del Producto (Features)**

Esta es una lista de las características principales que definen el producto.

| ID | Característica | Descripción |
| :--- | :--- | :--- |
| **FEAT-001** | **Arquitectura Multi-Tenant por Subdominio** | Cada tenant opera en un subdominio único (`[slug].midominio.com`), garantizando aislamiento de marca y datos. La administración de la plataforma reside en `admin.midominio.com`. |
| **FEAT-002** | **Gestión de Planes y Suscripciones** | El sistema soportará diferentes planes (ej. monousuario, multiusuario, multisucursal) que limitarán el acceso a funcionalidades y recursos. |
| **FEAT-003** | **Administración Centralizada de Negocio** | Los tenants pueden configurar sus servicios, incluyendo duración, costos, y qué personal puede realizarlos. |
| **FEAT-004** | **Motor de Disponibilidad Dinámico** | El sistema calculará la disponibilidad en tiempo real considerando los horarios complejos y multi-servicio del personal, excepciones y reservas existentes. |
| **FEAT-005** | **Portal de Reservas para Clientes** | Cada negocio tendrá una interfaz pública para sus clientes, ya sea una página de reserva simple o un widget para embeber en su propio sitio web. |
| **FEAT-006** | **Procesamiento de Pagos Integrado** | Integración con Stripe para cobrar depósitos o pagos completos en el momento de la reserva. |
| **FEAT-007** | **Gestión de Personal y Recursos** | Creación de perfiles para el personal (staff), asignación a servicios y gestión de sus horarios de trabajo individuales. |
| **FEAT-008** | **Constructor de Formularios Dinámicos** | Los administradores de negocio podrán añadir campos personalizados a sus formularios de reserva para capturar información específica del cliente o servicio. |
| **FEAT-009** | **Sistema de Notificaciones Automatizadas** | Comunicaciones transaccionales (confirmaciones, recordatorios, cancelaciones) vía email y SMS. |
| **FEAT-010** | **Dashboard y Reportes** | Paneles de control con métricas clave sobre reservas, ingresos y rendimiento del personal para la toma de decisiones. |

---

### **5. Restricciones**

1.  **Arquitectura Cloud-Only:** El sistema no soportará instalaciones on-premise.
2.  **Stack Tecnológico Definido:** El desarrollo se realizará con Next.js y Supabase.
3.  **Dependencia de RLS:** La seguridad y el aislamiento de datos dependen fundamentalmente de la correcta implementación de Row Level Security en PostgreSQL.
4.  **Enfoque de API Rate Limiting:** Se aplicarán límites de tasa en la API para prevenir abusos y garantizar la estabilidad de la plataforma para todos los tenants.

---

### **6. Rangos de Calidad**

*   **Rendimiento (Crítico):** El cálculo de disponibilidad debe resolverse en < 2 segundos. Los tiempos de carga de las interfaces de reserva deben ser < 1 segundo.
*   **Seguridad (Crítico):** Cero fugas de datos entre tenants. Cumplimiento con las mejores prácticas de OWASP y regulaciones de privacidad (GDPR/CCPA).
*   **Usabilidad (Alto):** El proceso de reserva para un cliente final debe ser completable en menos de 90 segundos. El onboarding para un nuevo tenant debe ser guiado y claro.
*   **Confiabilidad (Alto):** Uptime del sistema del 99.9%. Sin doble reservas garantizado por la lógica del sistema.

---

### **7. Precedencia y Prioridad**

El desarrollo seguirá un enfoque por fases para mitigar riesgos y entregar valor de forma temprana.

*   **Prioridad 1 (MVP - Fase 1):** Establecer las bases de la plataforma y la funcionalidad de reserva central.
    *   Incluye: **FEAT-001** (Subdominios), **FEAT-003** (Gestión básica de servicios), **FEAT-004** (Motor de disponibilidad), **FEAT-005** (Widget de reserva), **FEAT-006** (Pagos básicos), **FEAT-007** (Gestión de personal).
*   **Prioridad 2 (Sistema Completo - Fase 2):** Enriquecer la funcionalidad y la inteligencia del sistema.
    *   Incluye: **FEAT-002** (Gestión avanzada de planes), **FEAT-009** (Notificaciones completas), **FEAT-010** (Reportes).
*   **Prioridad 3 (Enterprise - Fase 3):** Añadir funcionalidades de alta personalización y extensibilidad.
    *   Incluye: **FEAT-008** (Formularios dinámicos), integraciones con calendarios externos y API pública.

