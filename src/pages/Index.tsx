import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { LandingHero } from "@/components/LandingHero";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { CityCarousel } from "@/components/CityCarousel";
import { motion } from "framer-motion";
import {
  CreditCard, Smartphone, Zap,
  Shield, Users, QrCode, ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCategoryLabel } from "@/lib/categories";
import { buyerFAQItems } from "@/data/faq-data";

const features = [
  { icon: CreditCard, title: "Pagamento seguro", desc: "PIX, cartão de crédito e boleto. Checkout rápido e protegido." },
  { icon: Smartphone, title: "Ingresso digital", desc: "QR Code único no celular. Sem necessidade de impressão." },
  { icon: Zap, title: "Entrega instantânea", desc: "Receba seus ingressos por e-mail e na área logada em segundos." },
  { icon: Shield, title: "Garantia de reembolso", desc: "Solicite reembolso facilmente caso o evento seja cancelado." },
  { icon: Users, title: "Transferência fácil", desc: "Transfira ingressos para amigos com apenas um clique." },
  { icon: QrCode, title: "Check-in rápido", desc: "Check-in na entrada do evento com leitura de QR Code." },
];


export default function Index() {
  const { user, role, loading } = useAuth();

  const { data: featuredEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, ticket_tiers(price)")
        .eq("status", "published")
        .eq("is_featured", true)
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(6);
      if (error) throw error;
      return (data || []).map((e: any) => {
        const prices = (e.ticket_tiers || []).map((t: any) => t.price ?? 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const { ticket_tiers, ...rest } = e;
        return { ...rest, min_price: minPrice };
      });
    },
  });

  // Redirect admin/producer to their dashboards; buyers stay on landing
  if (!loading && user && role) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "producer") return <Navigate to="/producer/dashboard" replace />;
    // Buyers can see the landing page
  }

  return (
    <>
      <LandingHero />

      {/* ===== CATEGORY CAROUSEL ===== */}
      <CategoryCarousel className="bg-secondary/30" />

      {/* ===== FEATURED EVENTS ===== */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold">Em destaque</h2>
              <p className="text-muted-foreground mt-1">Os eventos mais procurados da semana</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/eventos">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          {loadingEvents ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : featuredEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event: any, index: number) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={format(new Date(event.start_date), "dd MMM yyyy · HH'h'mm", { locale: ptBR })}
                  city={event.venue_city || "Online"}
                  imageUrl={event.cover_image_url}
                  priceFrom={event.min_price ?? 0}
                  category={event.category}
                  slug={event.slug}
                  eventId={event.id}
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum evento em destaque no momento.</p>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/eventos">Ver todos os eventos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl lg:text-3xl font-bold">Por que o TicketHall?</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Tudo o que você precisa para comprar e vender ingressos online.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CITY CAROUSEL ===== */}
      <CityCarousel className="bg-secondary/30" />

      {/* ===== CTA PRODUTOR ===== */}
      <section className="py-16 lg:py-24">
        <div className="container text-center space-y-6">
          <h2 className="font-display text-2xl lg:text-3xl font-bold">É produtor de eventos?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Crie seus eventos, venda ingressos e gerencie check-in com uma plataforma completa e sem mensalidade.
          </p>
          <Button variant="default" size="lg" asChild>
            <Link to="/produtores">
              Começar a vender grátis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-center mb-8">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {buyerFAQItems.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
