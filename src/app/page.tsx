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
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 bg-background/80 backdrop-blur-lg border-b">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">Reasy</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="shadow-md hover:shadow-lg transition">
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-24 md:py-36 text-center bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <p className="uppercase text-sm tracking-wide text-primary font-medium mb-2">
              Plataforma SaaS de Reservas
            </p>
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6 leading-tight">
              La forma más fácil de gestionar tu negocio
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Reasy simplifica tus reservas, optimiza tu agenda y potencia el
              crecimiento de tu negocio de servicios.
            </p>
            <Button
              size="lg"
              asChild
              className="shadow-lg hover:shadow-xl transition ring-2 ring-primary/20"
            >
              <Link href="/signup">Empieza Gratis</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold font-headline mb-8">
                  Todo lo que necesitas, en un solo lugar
                </h2>
                <div className="grid gap-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-card/50 p-4 rounded-xl border hover:shadow-md transition"
                    >
                      <div className="bg-accent/20 text-accent rounded-full p-2">
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="text-base md:text-lg text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition">
                <Image
                  src="https://picsum.photos/seed/salon-interior/1200/800"
                  alt="Salon Interior"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-primary/5 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-headline mb-6">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Únete a cientos de negocios que ya confían en Reasy.
            </p>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition"
              asChild
            >
              <Link href="/signup">Regístrate Ahora</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 bg-muted/50 border-t">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Reasy. Todos los derechos reservados.</p>
          <nav className="flex gap-4">
            <Link href="/terms" className="hover:text-primary transition">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-primary transition">
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}