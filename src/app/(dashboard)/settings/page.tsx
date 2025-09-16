import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { subscriptionPlans } from "@/lib/data"

export default function SettingsPage() {
  const userUsage = (subscriptionPlans.usage.users / subscriptionPlans.limits.users) * 100
  const locationUsage = (subscriptionPlans.usage.locations / subscriptionPlans.limits.locations) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Manage your billing and subscription details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold">{subscriptionPlans.current} Plan</h3>
            <p className="text-muted-foreground">($99.00 / month)</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <Label>Users</Label>
                <p className="text-sm text-muted-foreground">{subscriptionPlans.usage.users} of {subscriptionPlans.limits.users} used</p>
              </div>
              <Progress value={userUsage} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <Label>Locations</Label>
                <p className="text-sm text-muted-foreground">{subscriptionPlans.usage.locations} of {subscriptionPlans.limits.locations} used</p>
              </div>
              <Progress value={locationUsage} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button>Upgrade Plan</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Update your business information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input id="business-name" defaultValue="Acmé Salon" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="business-email">Contact Email</Label>
                <Input id="business-email" type="email" defaultValue="contact@acmesalon.com" />
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
            <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
