"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { login } from '@/actions/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login
      </Button>
    );
}

export default function AdminLoginPage() {
    const [state, formAction] = useFormState(login, undefined);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 font-body">
        <Card className="w-full max-w-sm shadow-md">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-4">
                    <Icons.logo className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-semibold font-headline">Platform Admin</h1>
                </div>
                <CardDescription>
                    Acceso exclusivo para administradores de Reasy.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="admin@reasy.app"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    {state?.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    </div>
  )
}
