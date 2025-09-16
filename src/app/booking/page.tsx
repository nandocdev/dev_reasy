import { BookingWidget } from '@/components/booking-widget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function BookingPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/20 p-4 font-body">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center items-center gap-3 mb-6">
            <Icons.logo className="h-8 w-auto text-primary" />
            <h1 className="text-3xl font-bold font-headline text-foreground">ReasyBook</h1>
        </div>
        <Card className="w-full shadow-2xl shadow-slate-200/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Book Your Appointment</CardTitle>
            <CardDescription>Fast, simple, and secure booking powered by Reasy.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingWidget />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
