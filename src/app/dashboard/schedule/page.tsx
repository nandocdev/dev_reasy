"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { staff } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { PlusCircle, Trash2 } from "lucide-react"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const ScheduleEditor = ({ staffMember }: { staffMember: typeof staff[0] }) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <h3 className="font-medium">Recurring Weekly Hours</h3>
        {daysOfWeek.map(day => (
          <div key={day} className="flex items-center gap-4 p-2 rounded-lg border">
            <Label htmlFor={`${day}-enabled`} className="w-24">{day}</Label>
            <div className="flex-1 grid grid-cols-2 gap-2">
                <Input type="time" defaultValue="09:00" />
                <Input type="time" defaultValue="17:00" />
            </div>
            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2"><PlusCircle className="h-4 w-4" /> Add Time Slot</Button>
      </div>
      <div>
        <h3 className="font-medium">Add Exceptions</h3>
        <p className="text-sm text-muted-foreground mb-2">Select dates for holidays or days off.</p>
        <Calendar
            mode="multiple"
            selected={[]}
            className="rounded-md border"
        />
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Schedules</CardTitle>
        <CardDescription>
          Manage working hours and exceptions for your team members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={staff[0].id}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {staff.map(member => (
              <TabsTrigger key={member.id} value={member.id}>{member.name}</TabsTrigger>
            ))}
          </TabsList>
          {staff.map(member => (
            <TabsContent key={member.id} value={member.id} className="mt-6">
              <ScheduleEditor staffMember={member} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
