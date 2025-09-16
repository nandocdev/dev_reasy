-- ==========================================
-- REASY SUPABASE SCHEMA - VERSIÓN 2.0
-- Multi-tenant SaaS with Row Level Security
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==========================================
-- CUSTOM TYPES
-- ==========================================

CREATE TYPE platform_user_role AS ENUM ('super_admin', 'admin', 'support', 'developer');
CREATE TYPE plan_type AS ENUM ('basic', 'professional', 'enterprise', 'custom');
CREATE TYPE plan_billing_period AS ENUM ('monthly', 'yearly', 'custom');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'cancelled', 'trial');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing', 'incomplete');
CREATE TYPE tnt_user_role AS ENUM ('owner', 'admin', 'location_manager', 'staff', 'viewer');
CREATE TYPE tnt_user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE tnt_service_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE tnt_resource_type AS ENUM ('staff', 'room', 'equipment');
CREATE TYPE tnt_deposit_type AS ENUM ('none', 'percentage', 'fixed');
CREATE TYPE tnt_customer_status AS ENUM ('active', 'inactive', 'banned');
CREATE TYPE tnt_customer_type AS ENUM ('registered', 'guest');
CREATE TYPE tnt_booking_status AS ENUM (
    'draft', 'pending_payment', 'confirmed', 'rescheduled',
    'cancelled', 'no_show', 'completed', 'expired'
);
CREATE TYPE tnt_payment_status AS ENUM (
    'pending', 'processing', 'succeeded', 'failed',
    'cancelled', 'refunded', 'partially_refunded'
);
CREATE TYPE tnt_payment_type AS ENUM ('deposit', 'full_payment', 'refund', 'penalty');
CREATE TYPE tnt_notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'push', 'webhook');
CREATE TYPE tnt_notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE tnt_audit_action AS ENUM (
    'create', 'read', 'update', 'delete',
    'login', 'logout', 'export', 'import'
);
CREATE TYPE tnt_form_field_type AS ENUM (
    'text', 'number', 'email', 'phone', 'select', 'multiselect', 
    'checkbox', 'date', 'time', 'textarea'
);


-- ==========================================
-- FUNCIONES AUXILIARES GLOBALES
-- ==========================================

-- Función para actualizar timestamps de 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para obtener el tenant_id del usuario actual en sesión
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- La aplicación DEBE establecer esta variable de sesión tras la autenticación.
  SELECT (current_setting('app.current_tenant_id', true))::uuid;
$$;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT current_setting('app.current_user_role', true);
$$;

-- Helper function to check if user is tenant admin/owner
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT get_current_user_role() IN ('owner', 'admin');
$$;

-- Function to generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number(tenant_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD(COALESCE(
               (SELECT COUNT(*) + 1 
                FROM tnt_bookings 
                WHERE tenant_id = tenant_uuid 
                AND DATE(created_at) = CURRENT_DATE), 1
           )::TEXT, 4, '0');
$$;

-- ==========================================
-- GLOBAL TABLES (Platform Level)
-- ==========================================

-- Platform Users (Admins, Support, etc.)
CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    encrypted_password VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role platform_user_role NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    two_factor_secret TEXT,
    two_factor_recovery_codes TEXT,
    two_factor_confirmed_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{}',
    raw_user_meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    type plan_type NOT NULL,
    billing_period plan_billing_period NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{
        "max_users": 10,
        "max_locations": 1,
        "max_services": 50,
        "max_bookings_per_month": 500,
        "storage_gb": 5
    }'::jsonb,
    trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Registration Requests
CREATE TABLE business_registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    contact_phone VARCHAR(50),
    country VARCHAR(3),
    requested_plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES platform_users(id),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Tenants (Business Organizations)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    business_type VARCHAR(100),
    domain VARCHAR(255),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status tenant_status DEFAULT 'trial',
    owner_platform_user_id UUID REFERENCES platform_users(id) ON DELETE RESTRICT,
    owner_email VARCHAR(255) NOT NULL,
    
    -- Configuration
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
    country VARCHAR(3) NOT NULL,
    language VARCHAR(5) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    
    -- Trial and billing
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Usage Tracking
CREATE TABLE tenant_usage (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, metric_name)
);
COMMENT ON TABLE tenant_usage IS 'Rastrea el uso actual de recursos limitados por plan para cada tenant.';

-- Platform Invoices
CREATE TABLE platform_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
    currency VARCHAR(3) NOT NULL CHECK (LENGTH(currency) = 3),
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    stripe_invoice_id VARCHAR(255),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Metrics
CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- TENANT-SPECIFIC TABLES (With RLS)
-- ==========================================

-- Tenant Users
CREATE TABLE tnt_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    role tnt_user_role NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    assigned_locations UUID[] DEFAULT '{}',
    is_service_provider BOOLEAN DEFAULT FALSE,
    specializations JSONB DEFAULT '[]'::jsonb,
    status tnt_user_status DEFAULT 'active',
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- User Profiles (Extended info)
CREATE TABLE tnt_user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tnt_users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    emergency_contact JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Invitations
CREATE TABLE tnt_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role tnt_user_role NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID REFERENCES tnt_users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Information
CREATE TABLE tnt_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- Business Locations
CREATE TABLE tnt_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES tnt_businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address JSONB NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    timezone VARCHAR(50),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Categories
CREATE TABLE tnt_service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES tnt_businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE tnt_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES tnt_businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES tnt_service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    buffer_before_minutes INTEGER DEFAULT 0 CHECK (buffer_before_minutes >= 0),
    buffer_after_minutes INTEGER DEFAULT 0 CHECK (buffer_after_minutes >= 0),
    capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
    status tnt_service_status DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Pricing
CREATE TABLE tnt_service_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES tnt_services(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency VARCHAR(3) NOT NULL CHECK (LENGTH(currency) = 3),
    deposit_type tnt_deposit_type DEFAULT 'none',
    deposit_amount DECIMAL(10,2) CHECK (deposit_amount IS NULL OR deposit_amount >= 0),
    is_default BOOLEAN DEFAULT FALSE,
    conditions JSONB,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (deposit_type = 'none' AND deposit_amount IS NULL) OR
        (deposit_type IN ('percentage', 'fixed') AND deposit_amount IS NOT NULL)
    )
);

-- Resources (Staff, Rooms, Equipment)
CREATE TABLE tnt_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES tnt_locations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tnt_users(id) ON DELETE SET NULL, -- For staff resources
    name VARCHAR(255) NOT NULL,
    type tnt_resource_type NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
    skills JSONB DEFAULT '[]'::jsonb,
    equipment JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff-Service Associations (RF-2.1.2)
CREATE TABLE tnt_service_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES tnt_services(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE CASCADE,
    is_primary_provider BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10,2),
    commission_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, service_id, resource_id)
);
COMMENT ON TABLE tnt_service_staff IS 'Tabla de unión (muchos-a-muchos) entre servicios y el personal que puede realizarlos.';

-- Booking Locks for Temporary Reservations (RF-3.3)
CREATE TABLE tnt_booking_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    locked_by_session VARCHAR(255) NOT NULL,
    locked_by_user_id UUID, -- Optional: para usuarios registrados
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, resource_id, start_time, end_time)
);
COMMENT ON TABLE tnt_booking_locks IS 'Implementa bloqueos optimistas para prevenir dobles reservas durante el flujo de checkout.';

-- Availability Cache (RNF-1.2)
CREATE TABLE tnt_availability_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE CASCADE,
    service_id UUID REFERENCES tnt_services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slots JSONB NOT NULL, -- [{start: "09:00", end: "09:30", available: true}, ...]
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    UNIQUE(tenant_id, resource_id, service_id, date)
);
COMMENT ON TABLE tnt_availability_cache IS 'Almacena resultados pre-calculados de disponibilidad para acelerar las consultas.';


-- Resource Schedules
CREATE TABLE tnt_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    recurrence_rule TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    time_slots JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Schedule Exceptions
CREATE TABLE tnt_schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('unavailable', 'custom_hours', 'holiday')),
    custom_hours JSONB,
    reason VARCHAR(255),
    created_by UUID REFERENCES tnt_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE tnt_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Only for registered customers
    type tnt_customer_type NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    status tnt_customer_status DEFAULT 'active',
    preferences JSONB DEFAULT '{}',
    marketing_consent BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (type = 'registered' AND email IS NOT NULL) OR
        (type = 'guest' AND (email IS NOT NULL OR phone IS NOT NULL))
    )
);

-- Bookings
CREATE TABLE tnt_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES tnt_businesses(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES tnt_locations(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES tnt_services(id) ON DELETE RESTRICT,
    resource_id UUID NOT NULL REFERENCES tnt_resources(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES tnt_customers(id) ON DELETE RESTRICT,
    status tnt_booking_status DEFAULT 'draft',
    booking_number VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    deposit_required DECIMAL(10,2) DEFAULT 0 CHECK (deposit_required >= 0),
    deposit_paid DECIMAL(10,2) DEFAULT 0 CHECK (deposit_paid >= 0),
    currency VARCHAR(3) NOT NULL CHECK (LENGTH(currency) = 3),
    source VARCHAR(50) DEFAULT 'web',
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES tnt_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES tnt_users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    CHECK (start_time < end_time),
    CHECK (deposit_required <= total_price),
    CHECK (deposit_paid <= deposit_required),
    UNIQUE(tenant_id, booking_number)
);

-- Dynamic Form Fields
CREATE TABLE tnt_form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES tnt_services(id) ON DELETE CASCADE, -- NULL si es global para el tenant
    field_name VARCHAR(100) NOT NULL,
    field_type tnt_form_field_type NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    field_help_text TEXT,
    field_options JSONB, -- Para selects: ["Option 1", "Option 2"]
    validation_rules JSONB DEFAULT '{}', -- {"min": 3, "max": 50, "pattern": "regex"}
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, service_id, field_name)
);
COMMENT ON TABLE tnt_form_fields IS 'Define la estructura de los campos de formulario personalizados por cada tenant.';

-- Booking Form Data
CREATE TABLE tnt_booking_form_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES tnt_bookings(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES tnt_form_fields(id) ON DELETE CASCADE,
    field_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, booking_id, field_id)
);
COMMENT ON TABLE tnt_booking_form_data IS 'Almacena los datos recolectados de los formularios dinámicos para cada reserva.';


-- Payments
CREATE TABLE tnt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES tnt_bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES tnt_customers(id) ON DELETE RESTRICT,
    type tnt_payment_type NOT NULL,
    status tnt_payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL CHECK (LENGTH(currency) = 3),
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255),
    provider_customer_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    failure_reason TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE tnt_notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    channel tnt_notification_channel NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE tnt_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES tnt_customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES tnt_bookings(id) ON DELETE CASCADE,
    template_id UUID REFERENCES tnt_notification_templates(id) ON DELETE SET NULL,
    channel tnt_notification_channel NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    status tnt_notification_status DEFAULT 'pending',
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE tnt_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tnt_users(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    action tnt_audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- ==========================================

-- Global table indexes
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX idx_tenants_owner ON tenants(owner_platform_user_id);
CREATE INDEX idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
CREATE INDEX idx_tenant_usage_tenant_metric ON tenant_usage(tenant_id, metric_name);
CREATE INDEX idx_platform_metrics_name_time ON platform_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_business_registration_requests_status ON business_registration_requests(status);

-- Tenant table indexes (includes tenant_id for RLS performance)
CREATE INDEX idx_tnt_users_tenant_email ON tnt_users(tenant_id, email);
CREATE INDEX idx_tnt_users_tenant_supabase_id ON tnt_users(tenant_id, supabase_user_id);
CREATE INDEX idx_tnt_users_tenant_role ON tnt_users(tenant_id, role);

CREATE INDEX idx_tnt_businesses_tenant_active ON tnt_businesses(tenant_id, is_active);
CREATE INDEX idx_tnt_locations_tenant_business ON tnt_locations(tenant_id, business_id);

CREATE INDEX idx_tnt_services_tenant_business_status ON tnt_services(tenant_id, business_id, status);
CREATE INDEX idx_tnt_resources_tenant_location_type ON tnt_resources(tenant_id, location_id, type);
CREATE INDEX idx_tnt_resources_tenant_user ON tnt_resources(tenant_id, user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_tnt_bookings_tenant_resource_time ON tnt_bookings(tenant_id, resource_id, start_time, end_time);
CREATE INDEX idx_tnt_bookings_tenant_customer_status ON tnt_bookings(tenant_id, customer_id, status);
CREATE INDEX idx_tnt_bookings_tenant_status_start_time ON tnt_bookings(tenant_id, status, start_time);
CREATE INDEX idx_tnt_bookings_tenant_created_at ON tnt_bookings(tenant_id, created_at DESC);
CREATE INDEX idx_tnt_bookings_booking_number ON tnt_bookings(tenant_id, booking_number);

CREATE INDEX idx_tnt_customers_tenant_email ON tnt_customers(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_tnt_customers_tenant_phone ON tnt_customers(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_tnt_customers_tenant_supabase_id ON tnt_customers(tenant_id, supabase_user_id) WHERE supabase_user_id IS NOT NULL;
CREATE INDEX idx_tnt_customers_tenant_status ON tnt_customers(tenant_id, status);

CREATE INDEX idx_tnt_payments_tenant_booking ON tnt_payments(tenant_id, booking_id);
CREATE INDEX idx_tnt_payments_tenant_customer ON tnt_payments(tenant_id, customer_id, created_at DESC);

CREATE INDEX idx_tnt_notifications_tenant_scheduled ON tnt_notifications(tenant_id, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_tnt_notifications_tenant_customer ON tnt_notifications(tenant_id, customer_id, created_at DESC);

CREATE INDEX idx_tnt_schedules_tenant_resource_dates ON tnt_schedules(tenant_id, resource_id, start_date, end_date);
CREATE INDEX idx_tnt_schedule_exceptions_tenant_resource_date ON tnt_schedule_exceptions(tenant_id, resource_id, exception_date);

CREATE INDEX idx_tnt_audit_logs_tenant_entity ON tnt_audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_tnt_audit_logs_tenant_user_time ON tnt_audit_logs(tenant_id, user_id, created_at DESC);

-- Índices para las nuevas tablas
CREATE INDEX idx_tnt_service_staff_tenant_service ON tnt_service_staff(tenant_id, service_id);
CREATE INDEX idx_tnt_service_staff_tenant_resource ON tnt_service_staff(tenant_id, resource_id);

CREATE INDEX idx_tnt_booking_locks_expires_at ON tnt_booking_locks(expires_at);

CREATE INDEX idx_availability_cache_lookup ON tnt_availability_cache(tenant_id, resource_id, date);


-- ==========================================
-- FUNCIONES DE LÓGICA DE NEGOCIO EN DB
-- ==========================================
-- Función para verificar si un tenant puede crear un nuevo recurso limitado
CREATE OR REPLACE FUNCTION check_tenant_limit(
    tenant_uuid UUID, 
    metric_name VARCHAR,
    increment_by INTEGER DEFAULT 1
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    max_allowed INTEGER;
    plan_limits JSONB;
BEGIN
    -- Obtener límites del plan actual del tenant
    SELECT sp.limits INTO plan_limits
    FROM tenants t
    JOIN subscription_plans sp ON sp.id = t.plan_id
    WHERE t.id = tenant_uuid;
    
    -- Extraer el límite específico del JSON. ej: 'max_users'
    max_allowed := (plan_limits ->> metric_name)::INTEGER;
    
    -- Si no hay un límite definido en el plan para esta métrica, permitir siempre.
    IF max_allowed IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Obtener el uso actual de la métrica
    SELECT COALESCE(tu.current_value, 0) INTO current_usage
    FROM tenant_usage tu
    WHERE tu.tenant_id = tenant_uuid AND tu.metric_name = metric_name;
    
    -- Verificar si el uso actual más el incremento es menor o igual que el máximo permitido
    RETURN (current_usage + increment_by) <= max_allowed;
END;
$$;
COMMENT ON FUNCTION check_tenant_limit IS 'Verifica si un tenant ha excedido un límite de su plan (ej. max_users). Usar en triggers BEFORE INSERT.';

-- Función para incrementar/decrementar el uso de una métrica
CREATE OR REPLACE FUNCTION update_tenant_usage(
    tenant_uuid UUID,
    metric_name VARCHAR,
    increment_by INTEGER DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tenant_usage (tenant_id, metric_name, current_value, updated_at)
    VALUES (tenant_uuid, metric_name, increment_by, NOW())
    ON CONFLICT (tenant_id, metric_name)
    DO UPDATE SET 
        current_value = tenant_usage.current_value + increment_by,
        updated_at = NOW();
END;
$$;
COMMENT ON FUNCTION update_tenant_usage IS 'Actualiza el contador de uso para una métrica de un tenant.';


-- Función para invalidar cache de disponibilidad
CREATE OR REPLACE FUNCTION invalidate_availability_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_resource_id UUID;
BEGIN
    affected_resource_id := COALESCE(NEW.resource_id, OLD.resource_id);

    -- Invalidar caché para el recurso afectado.
    DELETE FROM tnt_availability_cache 
    WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND resource_id = affected_resource_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ==========================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en TODAS las tablas con prefijo tnt_
-- (Se asume la ejecución de ALTER TABLE ... ENABLE ROW LEVEL SECURITY; para todas las tablas de tenant)

-- Política genérica de aislamiento por tenant
CREATE POLICY "Tenant isolation" ON tnt_users FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_businesses FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_locations FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_services FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_resources FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_bookings FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_service_staff FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_booking_locks FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_availability_cache FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_form_fields FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "Tenant isolation" ON tnt_booking_form_data FOR ALL USING (tenant_id = get_current_tenant_id());
-- ... (y así para todas las tablas tnt_)


-- (Se pueden añadir políticas más granulares por rol sobre estas políticas base de aislamiento)

-- ==========================================
-- TRIGGERS DE BASE DE DATOS
-- ==========================================

-- Triggers para actualizar 'updated_at'
-- (Se asume la creación de triggers para todas las tablas relevantes)
CREATE TRIGGER update_platform_users_updated_at BEFORE UPDATE ON platform_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tnt_users_updated_at BEFORE UPDATE ON tnt_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tnt_services_updated_at BEFORE UPDATE ON tnt_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ...etc para el resto de tablas con `updated_at`.

-- Triggers para hacer cumplir los límites del plan
CREATE OR REPLACE FUNCTION enforce_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT check_tenant_limit(NEW.tenant_id, 'max_users') THEN
        RAISE EXCEPTION 'User limit for the current plan has been reached.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_user_limit_before_insert
    BEFORE INSERT ON tnt_users
    FOR EACH ROW EXECUTE FUNCTION enforce_user_limit();

-- Triggers para invalidación de caché (RNF-1.2.2)
CREATE TRIGGER invalidate_cache_on_booking_change
    AFTER INSERT OR UPDATE OR DELETE ON tnt_bookings
    FOR EACH ROW EXECUTE FUNCTION invalidate_availability_cache();

CREATE TRIGGER invalidate_cache_on_schedule_change
    AFTER INSERT OR UPDATE OR DELETE ON tnt_schedules
    FOR EACH ROW EXECUTE FUNCTION invalidate_availability_cache();

CREATE TRIGGER invalidate_cache_on_exception_change
    AFTER INSERT OR UPDATE OR DELETE ON tnt_schedule_exceptions
    FOR EACH ROW EXECUTE FUNCTION invalidate_availability_cache();

-- ==========================================
-- TRABAJOS PROGRAMADOS (CRON JOBS)
-- ==========================================

-- Limpiar locks de reserva expirados cada 5 minutos
SELECT cron.schedule(
    'cleanup-booking-locks', 
    '*/5 * * * *', 
    $$ DELETE FROM tnt_booking_locks WHERE expires_at < NOW(); $$
);

-- Limpiar caché de disponibilidad expirado cada hora
SELECT cron.schedule(
    'cleanup-availability-cache',
    '0 * * * *', -- A la hora en punto
    $$ DELETE FROM tnt_availability_cache WHERE expires_at < NOW(); $$
);

    