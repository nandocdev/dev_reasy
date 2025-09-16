import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { logout } from '@/actions/auth';

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/admin/login');
  }

  // TODO: Check if user has platform_admin role.

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 font-body">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Platform Admin!</CardTitle>
          <CardDescription>
            You have successfully logged in. This is the main dashboard for platform management.
            <p className="font-mono text-xs mt-4 bg-muted p-2 rounded">User: {user.email}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form action={logout}>
              <Button type="submit" variant="outline" className="w-full">Logout</Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
