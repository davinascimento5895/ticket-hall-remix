import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { Spotlight } from "@/components/core/spotlight";
import { TextLoop } from "@/components/core/text-loop";
import { motion } from "framer-motion";
import {
  CreditCard, Smartphone, Zap,
  Shield, Users, QrCode, ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedEvents } from "@/lib/api";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  { icon: CreditCard, title: "Pagamento seguro", desc: "PIX, cartão de crédito e boleto. Checkout rápido e protegido." },
  { icon: Smartphone, title: "Ingresso digital", desc: "QR Code único no celular. Sem necessidade de impressão." },
  { icon: Zap, title: "Entrega instantânea", desc: "Receba seus ingressos por e-mail e na área logada em segundos." },
  { icon: Shield, title: "Garantia de reembolso", desc: "Solicite reembolso facilmente caso o evento seja cancelado." },
  { icon: Users, title: "Transferência fácil", desc: "Transfira ingressos para amigos com apenas um clique." },
  { icon: QrCode, title: "Check-in rápido", desc: "Check-in na entrada do evento com leitura de QR Code." },
];

const faqs = [
  { q: "Como compro ingressos?", a: "Basta acessar a página do evento, selecionar os ingressos desejados e finalizar a compra com PIX, cartão ou boleto." },
  { q: "Posso transferir meu ingresso?", a: "Sim! Na área 'Meus Ingressos', clique em transferir e informe o e-mail do destinatário." },
  { q: "Como funciona o reembolso?", a: "Caso o evento seja cancelado, o reembolso é automático. Para outros casos, solicite pelo painel em até 7 dias antes." },
  { q: "O que é a fila virtual?", a: "Alguns eventos com alta demanda utilizam fila virtual para garantir uma experiência justa na compra." },
  { q: "É seguro comprar pelo TicketHall?", a: "Sim. Todos os pagamentos são processados com criptografia e seguimos as normas da LGPD." },
];

export default function Index() {
  const { user, role, loading } = useAuth();

  const { data: featuredEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["featured-events"],
    queryFn: getFeaturedEvents,
  });

  // Redirect logged-in users to their dashboard
  if (!loading && user && role) {
    const redirectMap: Record<string, string> = {
      admin: "/admin/dashboard",
      producer: "/producer/dashboard",
      buyer: "/meus-ingressos",
    };
    return <Navigate to={redirectMap[role] || "/meus-ingressos"} replace />;
  }

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <Spotlight size={500} className="z-0" />
        <div className="container relative z-10 text-center space-y-6 py-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            Seus ingressos para{" "}
            <TextLoop interval={3000} className="text-primary inline-block">
              <span>shows</span>
              <span>festivais</span>
              <span>teatros</span>
              <span>eventos</span>
            </TextLoop>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Compre, transfira e gerencie seus ingressos com segurança. A plataforma completa para produtores e compradores.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="default" size="lg" asChild>
              <Link to="/eventos">
                Explorar eventos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/produtores">Sou produtor</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED EVENTS ===== */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Em destaque</h2>
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
              {featuredEvents.map((event: any) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={format(new Date(event.start_date), "dd MMM yyyy · HH'h'mm", { locale: ptBR })}
                  city={event.venue_city || "Online"}
                  imageUrl={event.cover_image_url || "/placeholder.svg"}
                  priceFrom={0}
                  category={event.category}
                  slug={event.slug}
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Por que o TicketHall?</h2>
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

      {/* ===== CTA PRODUTOR ===== */}
      <section className="py-16 md:py-24">
        <div className="container text-center space-y-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold">É produtor de eventos?</h2>
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
