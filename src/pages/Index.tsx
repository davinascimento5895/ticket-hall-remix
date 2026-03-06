import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { Spotlight } from "@/components/core/spotlight";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useCityDetection } from "@/hooks/useCityDetection";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EventFilters } from "@/components/EventFilters";
import { api } from "@/lib/api";

export default function Index() {
  const { user } = useAuth();
  const { city, loading: cityLoading, requestLocation } = useCityDetection();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/events").then((response) => {
      setEvents(response.data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative py-12 md:py-24 bg-muted">
        <div className="container relative z-10">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Descubra os melhores eventos perto de você
          </h1>
          <p className="mt-4 max-w-[700px] text-muted-foreground">
            Encontre eventos incríveis, shows, festas e muito mais.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/eventos">
                Ver todos os eventos <CalendarDays className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {city ? (
              <Button variant="outline" size="lg" asChild>
                <Link to="/eventos">
                  Eventos em {city} <MapPin className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={requestLocation} disabled={cityLoading}>
                {cityLoading ? "Detectando..." : "Detectar minha localização"}
              </Button>
            )}
          </div>

          <div className="mt-8">
            <Input type="search" placeholder="Buscar eventos" className="md:w-[400px]" prefix={<Search className="w-4 h-4 mr-2" />} />
          </div>
        </div>

        <Spotlight
          className="-top-40 left-0 md:left-1/2 md:-translate-x-1/2 w-[100vw] h-[60vh] md:h-[80vh] rounded-none md:rounded-full"
          style={{
            "--spotlight-color": "var(--primary)",
          }}
        />
      </section>

      {/* Event List */}
      <section className="py-12 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Em destaque
            </h2>
            <Link to="/eventos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Ver todos os eventos
            </Link>
          </div>

          <Separator className="my-4" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <>
                <Skeleton className="w-full h-[200px] rounded-md" />
                <Skeleton className="w-full h-[200px] rounded-md" />
                <Skeleton className="w-full h-[200px] rounded-md" />
                <Skeleton className="w-full h-[200px] rounded-md" />
              </>
            ) : events.length > 0 ? (
              events.slice(0, 8).map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  imageUrl={event.image_url}
                  title={event.name}
                  date={event.start_date}
                  location={event.location}
                  price={event.price}
                  slug={event.slug}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Nenhum evento encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Filters */}
      <section className="py-12 md:py-24 bg-secondary">
        <div className="container">
          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
            Explore por categoria
          </h2>
          <p className="text-muted-foreground">Encontre eventos para todos os gostos.</p>

          <EventFilters />
        </div>
      </section>

      {/* Call to action */}
      {!user && (
        <section className="py-12 md:py-24">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                  Crie sua conta agora
                </h2>
                <p className="text-muted-foreground">
                  Tenha acesso a recursos exclusivos, como lista de desejos, notificações personalizadas e muito mais.
                </p>
              </div>
              <div className="flex flex-col justify-center">
                <Button size="lg" asChild>
                  <Link to="/?login=true">Criar conta grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
