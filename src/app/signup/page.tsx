"use client";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { requestBusinessRegistration, type RegistrationState } from "@/actions/tenant"
import { useActionState } from "react"

export default function SignupPage() {
  const [state, formAction] = useActionState(requestBusinessRegistration, null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 font-body">
      <Card className="mx-auto max-w-sm w-full shadow-lg">
        <CardHeader>
          <Link href="/" className="flex justify-center mb-4">
            <Icons.logo className="h-10 w-10 text-primary" />
          </Link>
          <CardTitle className="text-2xl text-center font-headline">Crea tu espacio de trabajo</CardTitle>
          <CardDescription className="text-center">
            Introduce tu información para empezar con Reasy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ¡Solicitud enviada correctamente! Nuestro equipo revisará tu solicitud y te contactaremos pronto.
              </AlertDescription>
            </Alert>
          )}
          
          {state?.error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Nombre del Negocio</Label>
              <Input 
                id="businessName" 
                name="businessName"
                placeholder="Acmé Salon" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Teléfono (opcional)</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder="+34 600 123 456"
              />
            </div>
            <Button type="submit" className="w-full">
              Solicitar acceso
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline text-primary">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
