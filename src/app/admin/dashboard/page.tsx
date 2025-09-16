import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

const pendingRequests = [
    { id: '1', businessName: 'Acmé Salon', email: 'owner@acmesalon.com', plan: 'Professional', requestedAt: '2024-07-29' },
    { id: '2', businessName: 'The Barber Shop', email: 'contact@barbers.com', plan: 'Basic', requestedAt: '2024-07-28' },
];

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/admin/login');
  }

  // TODO: Check if user has platform_admin role.

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8 bg-muted/40 font-body">
      <div className="w-full max-w-7xl space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold font-headline">Platform Dashboard</h1>
                <p className="text-muted-foreground">Welcome, {user.email}</p>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Owner Email</TableHead>
                                <TableHead>Requested Plan</TableHead>
                                <TableHead>Requested At</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.businessName}</TableCell>
                                    <TableCell>{req.email}</TableCell>
                                    <TableCell><Badge variant="outline">{req.plan}</Badge></TableCell>
                                    <TableCell>{req.requestedAt}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Approve</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Reject</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
