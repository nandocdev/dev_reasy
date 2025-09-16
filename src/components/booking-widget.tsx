"use client";

import React, { useState, useTransition, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Loader2, CheckCircle, User, AtSign, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getAvailableSlots } from "@/actions/booking";
import type { CalculateAvailabilityOutput } from "@/ai/flows/availability-calculation-ai";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { services } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

type Step = "service" | "datetime" | "details" | "confirmation";

export function BookingWidget() {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<CalculateAvailabilityOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep("datetime");
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    setSelectedSlot(null);
    setAvailability(null);
    startTransition(async () => {
      try {
        const result = await getAvailableSlots(selectedService, selectedDate);
        setAvailability(result);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching availability",
          description: "Could not fetch available slots. Please try again later.",
        });
      }
    });
  };

  const progressValue = useMemo(() => {
    const steps: Step[] = ["service", "datetime", "details", "confirmation"];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  }, [step]);

  const currentService = services.find(s => s.id === selectedService);

  return (
    <div className="space-y-8">
      <Progress value={progressValue} className="w-full" />

      {step === "service" && (
        <div>
          <h3 className="text-lg font-medium mb-4">1. Select a Service</h3>
          <Select onValueChange={handleServiceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex justify-between w-full">
                    <span>{service.name}</span>
                    <span className="text-muted-foreground">{service.duration} min - ${service.price.toFixed(2)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === "datetime" && (
        <div className="space-y-4">
            <Button variant="link" onClick={() => setStep("service")} className="p-0">Change Service</Button>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">2. Select Date & Time</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Available Slots</h3>
              {isPending && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Calculating...</span></div>}
              {availability && (
                <div className="grid grid-cols-3 gap-2">
                  {availability.availableSlots.length > 0 ? (
                    availability.availableSlots.map((slot) => (
                      <Button
                        key={slot.startTime}
                        variant={selectedSlot === slot.startTime ? "default" : "outline"}
                        onClick={() => {
                          setSelectedSlot(slot.startTime);
                          setStep("details");
                        }}
                      >
                        {format(parseISO(slot.startTime), "p")}
                      </Button>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-3">No available slots for this date.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {availability?.summary && <Alert><AlertDescription>{availability.summary}</AlertDescription></Alert>}
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
            <Button variant="link" onClick={() => setStep("datetime")} className="p-0">Change Date/Time</Button>
          <h3 className="text-lg font-medium mb-4">3. Your Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="name">Full Name</Label>
              <User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="John Doe" required className="pl-9" />
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="email">Email</Label>
              <AtSign className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="john@example.com" required className="pl-9" />
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="phone">Phone Number</Label>
              <Phone className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="(123) 456-7890" className="pl-9" />
            </div>
            <Button onClick={() => setStep("confirmation")} className="w-full">
              Confirm Details
            </Button>
          </div>
        </div>
      )}

      {step === "confirmation" && (
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-semibold">Appointment Pending!</h3>
          <p className="text-muted-foreground">Your appointment is almost booked. Please confirm the details below and complete payment.</p>
          <Card className="text-left">
            <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Service:</strong> {currentService?.name}</p>
                <p><strong>Date:</strong> {date && format(date, "PPP")}</p>
                <p><strong>Time:</strong> {selectedSlot && format(parseISO(selectedSlot), "p")}</p>
                <p><strong>Price:</strong> ${currentService?.price.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Pay with Stripe & Book Appointment
          </Button>
          <Button variant="link" onClick={() => setStep("details")} className="p-0">Edit Details</Button>
        </div>
      )}
    </div>
  );
}
