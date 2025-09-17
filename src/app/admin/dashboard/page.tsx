import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { logout } from '@/actions/auth';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createServerActionClient } from '@/lib/supabase/server';
import { ApprovalActions } from './components/ApprovalActions';

export default async function AdminDashboardPage() {
  // Verificar autorización y obtener datos del usuario
  const platformUser = await requirePlatformAdmin();
  
  // Obtener solicitudes pendientes de la base de datos
  const supabase = createServerActionClient();
  const { data: pendingRequests } = await supabase
    .from('business_registration_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8 bg-muted/40 font-body">
      <div className="w-full max-w-7xl space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-headline">Platform Dashboard</h1>
                <p className="text-muted-foreground">Welcome, {platformUser.first_name} {platformUser.last_name} ({platformUser.role})</p>
            </div>
            <form action={logout}>
                <Button type="submit" variant="outline">Logout</Button>
            </form>
        </div>

        <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requests">Registration Requests</TabsTrigger>
                <TabsTrigger value="tenants">All Tenants</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>System metrics and general status will be displayed here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Coming soon...</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="requests">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Registration Requests</CardTitle>
                        <CardDescription>Review and approve new businesses joining the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingRequests && pendingRequests.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Owner Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Requested At</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingRequests.map((req: any) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.business_name}</TableCell>
                                        <TableCell>{req.email}</TableCell>
                                        <TableCell>{req.contact_phone || 'N/A'}</TableCell>
                                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <ApprovalActions requestId={req.id} />
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay solicitudes pendientes de aprobación.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="tenants">
            <Card>
                    <CardHeader>
                        <CardTitle>All Tenants</CardTitle>
                        <CardDescription>Manage all active, suspended, and trialing tenants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Tenant management interface coming soon...</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
