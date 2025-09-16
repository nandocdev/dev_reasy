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
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

const pendingTenants = [
    { businessName: "Glamour Salon", owner: "Alice Johnson", email: "alice@glamour.com", requested: "2 days ago" },
    { businessName: "Iron Gym", owner: "Bob Williams", email: "bob@irongym.fit", requested: "5 hours ago" },
    { businessName: "Creative Consultants", owner: "Charlie Brown", email: "charlie@creative.co", requested: "1 day ago" },
]

export default function AdminPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 font-body">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <div className="flex items-center gap-2">
                <Icons.logo className="h-7 w-7 text-primary" />
                <h1 className="text-xl font-semibold">Platform Administration</h1>
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pt-0">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Tenant Approval Queue</CardTitle>
                    <CardDescription>
                    Review and approve new business sign-ups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingTenants.map((tenant, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{tenant.businessName}</TableCell>
                            <TableCell>{tenant.owner}</TableCell>
                            <TableCell className="text-muted-foreground">{tenant.email}</TableCell>
                            <TableCell>{tenant.requested}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm">Deny</Button>
                                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/80">Approve</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    </div>
  )
}
