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
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Calendar, BarChart } from "lucide-react"

const statCards = [
    { title: "Today's Revenue", value: "$452.32", change: "+20.1% from last month", icon: DollarSign },
    { title: "New Clients", value: "+23", change: "this month", icon: Users },
    { title: "Today's Bookings", value: "12", change: "+3 since yesterday", icon: Calendar },
    { title: "Occupancy Rate", value: "72%", change: "this week", icon: BarChart },
]

const upcomingAppointments = [
    { customer: "Olivia Martin", service: "Deep Tissue Massage", time: "2:00 PM", status: "Confirmed", staff: "Jane Doe" },
    { customer: "Jackson Lee", service: "Men's Haircut", time: "3:00 PM", status: "Confirmed", staff: "John Smith" },
    { customer: "Isabella Nguyen", service: "Classic Manicure", time: "4:30 PM", status: "Pending", staff: "Emily White" },
    { customer: "William Kim", service: "Color & Highlights", time: "5:00 PM", status: "Confirmed", staff: "Jane Doe" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Here are the next appointments scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.map((appt, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{appt.customer}</TableCell>
                    <TableCell>{appt.service}</TableCell>
                    <TableCell>{appt.staff}</TableCell>
                    <TableCell>{appt.time}</TableCell>
                    <TableCell>
                      <Badge variant={appt.status === "Confirmed" ? "outline" : "secondary"}>
                        {appt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
