import { Search, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";

const mockEvents = [
  { title: "Lollapalooza Brasil 2025", date: "28 Mar 2025", city: "São Paulo, SP", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", priceFrom: 450, category: "music" as const },
  { title: "Stand Up Comedy — Fábio Porchat", date: "15 Abr 2025", city: "Rio de Janeiro, RJ", imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&q=80", priceFrom: 80, category: "theater" as const },
  { title: "Final Copa do Brasil", date: "10 Mai 2025", city: "Belo Horizonte, MG", imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80", priceFrom: 120, category: "sports" as const },
  { title: "Festival Gastronômico BH", date: "22 Jun 2025", city: "Belo Horizonte, MG", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", priceFrom: 0, category: "festival" as const },
  { title: "Tech Summit Brasil", date: "05 Jul 2025", city: "Florianópolis, SC", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", priceFrom: 250, category: "corporate" as const },
  { title: "Sertanejo in Rio", date: "18 Ago 2025", city: "Rio de Janeiro, RJ", imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", priceFrom: 90, category: "music" as const },
];

export default function Eventos() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container pt-24 pb-16">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar eventos, artistas, locais..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Todos os eventos</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEvents.map((event, i) => (
            <EventCard key={i} {...event} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg">Carregar mais eventos</Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
