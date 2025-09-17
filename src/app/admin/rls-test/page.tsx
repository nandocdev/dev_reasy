import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { testRLSAccess, testTenantIsolation } from '@/actions/rls-test';

export default async function RLSTestPage() {
  // Verificar autorización
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8 bg-muted/40 font-body">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-headline">RLS Testing Dashboard</h1>
          <p className="text-muted-foreground">Pruebas para verificar que Row Level Security funciona correctamente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Prueba Básica de RLS</CardTitle>
              <CardDescription>
                Verifica que el contexto de tenant se establece correctamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RLSTestForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Estado actual de RLS y configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Función RLS:</strong> get_current_tenant_id()
              </div>
              <div>
                <strong>Variable de Sesión:</strong> app.current_tenant_id
              </div>
              <div>
                <strong>Script de Setup:</strong> /scripts/setup-rls.sql
              </div>
              <div className="text-sm text-muted-foreground">
                Para activar RLS, ejecuta el script setup-rls.sql en tu base de datos de Supabase.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cómo Probar RLS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Ejecutar Script SQL</h4>
              <p className="text-sm text-muted-foreground">
                Ejecuta <code>/scripts/setup-rls.sql</code> en tu base de datos de Supabase para crear las funciones RPC y activar RLS.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">2. Crear Tenants de Prueba</h4>
              <p className="text-sm text-muted-foreground">
                Crea algunos tenants usando el formulario de registro y apruébalos desde el dashboard admin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">3. Probar Contexto</h4>
              <p className="text-sm text-muted-foreground">
                Usa el formulario de arriba para verificar que el contexto de tenant se establece correctamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RLSTestForm() {
  return (
    <form action={async (formData: FormData) => {
      'use server';
      const testTenantId = formData.get('tenantId') as string;
      const result = await testRLSAccess(testTenantId || undefined);
      console.log('RLS Test Result:', result);
    }} className="space-y-4">
      <div>
        <label htmlFor="tenantId" className="block text-sm font-medium mb-1">
          Tenant ID (opcional)
        </label>
        <input
          type="text"
          id="tenantId"
          name="tenantId"
          placeholder="Deja en blanco para usar contexto actual"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <Button type="submit">
        Probar RLS
      </Button>
      <div className="text-xs text-muted-foreground">
        Resultado se mostrará en la consola del servidor
      </div>
    </form>
  );
}