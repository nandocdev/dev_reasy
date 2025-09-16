import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Image from "next/image";

const features = [
  "Gestión de reservas 24/7",
  "Motor de disponibilidad inteligente",
  "Widget de reserva integrable",
  "Gestión de personal y horarios",
  "Procesamiento de pagos seguro",
  "Notificaciones automáticas",
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">Reasy</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 text-center bg-muted/20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">
              La forma más fácil de gestionar tu negocio
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Reasy es la plataforma todo-en-uno que simplifica tus reservas, optimiza tu agenda y potencia el crecimiento de tu negocio de servicios.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">Empieza Gratis</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold font-headline mb-6">Todo lo que necesitas, en un solo lugar</h2>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="bg-accent/20 text-accent rounded-full p-1">
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="text-lg text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
                 <Image src="https://picsum.photos/seed/salon-interior/1200/800" alt="Salon Interior" layout="fill" objectFit="cover" data-ai-hint="salon interior" />
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-primary/10 py-20">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold font-headline mb-4">Listo para transformar tu negocio?</h2>
                <p className="text-lg text-muted-foreground mb-8">Únete a cientos de negocios que ya confían en Reasy.</p>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href="/signup">Regístrate Ahora</Link>
                </Button>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Reasy. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
