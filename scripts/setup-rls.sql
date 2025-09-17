-- ==========================================
-- FUNCIONES RPC PARA CONTEXTO DE TENANT
-- ==========================================

-- Función para establecer variables de configuración de sesión
CREATE OR REPLACE FUNCTION set_app_config(config_name text, config_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Establecer la variable de configuración de sesión
  PERFORM set_config(config_name, config_value, false);
END;
$$;

-- Función para obtener variables de configuración de sesión
CREATE OR REPLACE FUNCTION get_app_config(config_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting(config_name, true);
END;
$$;

-- Función específica para establecer el tenant ID actual
CREATE OR REPLACE FUNCTION set_current_tenant_id(tenant_id_value uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id_value::text, false);
END;
$$;

-- Función específica para establecer el rol del usuario actual
CREATE OR REPLACE FUNCTION set_current_user_role(role_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_role', role_value, false);
END;
$$;

-- ==========================================
-- ACTIVAR ROW LEVEL SECURITY EN TABLAS BÁSICAS
-- ==========================================

-- Activar RLS en tablas tnt_* que ya existen
-- (Las tablas que no existen aún se activarán cuando se creen)

-- Estas son las tablas que probablemente ya existen en el esquema actual
DO $$
DECLARE
    table_name text;
    table_names text[] := ARRAY[
        'tnt_users'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        -- Verificar si la tabla existe antes de activar RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS enabled for table: %', table_name;
            
            -- Crear política básica de aislamiento por tenant si no existe
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = table_name 
                AND policyname = 'Tenant Isolation'
            ) THEN
                EXECUTE format(
                    'CREATE POLICY "Tenant Isolation" ON %I FOR ALL USING (tenant_id = get_current_tenant_id())',
                    table_name
                );
                RAISE NOTICE 'Tenant Isolation policy created for table: %', table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping RLS activation', table_name;
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON FUNCTION set_app_config IS 'Establece una variable de configuración de sesión. Usar desde middleware/Server Actions.';
COMMENT ON FUNCTION get_app_config IS 'Obtiene una variable de configuración de sesión.';
COMMENT ON FUNCTION set_current_tenant_id IS 'Establece el tenant_id actual para RLS.';
COMMENT ON FUNCTION set_current_user_role IS 'Establece el rol del usuario actual para RLS.';

-- Nota importante: Estas funciones deben ser llamadas al inicio de cada 
-- request para establecer el contexto correcto antes de hacer consultas
-- a las tablas con RLS activado.