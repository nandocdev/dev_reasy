
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

export default function AdminLoginPage() {
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
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@reasy.app"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full">
                        Login
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
