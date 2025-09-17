-- Insertar planes de suscripción básicos para probar el flujo
INSERT INTO subscription_plans (
    id,
    name,
    slug,
    type,
    price_monthly,
    price_yearly,
    max_users,
    max_locations,
    features,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'Plan Básico',
    'basic',
    'basic',
    29.99,
    299.99,
    5,
    1,
    '["Gestión de citas", "Panel básico", "Soporte por email"]',
    true,
    now(),
    now()
),
(
    gen_random_uuid(),
    'Plan Profesional',
    'professional',
    'professional',
    59.99,
    599.99,
    15,
    3,
    '["Gestión de citas", "Panel avanzado", "Reportes", "Soporte prioritario", "Múltiples ubicaciones"]',
    true,
    now(),
    now()
),
(
    gen_random_uuid(),
    'Plan Empresarial',
    'enterprise',
    'enterprise',
    99.99,
    999.99,
    50,
    10,
    '["Todas las funciones", "API access", "Soporte 24/7", "Integrations", "Custom branding"]',
    true,
    now(),
    now()
);

-- Insertar un usuario administrador de plataforma para probar
INSERT INTO platform_users (
    id,
    supabase_user_id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin-test-uuid',
    'admin@reasy.com',
    'Admin',
    'Platform',
    'super_admin',
    true,
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;