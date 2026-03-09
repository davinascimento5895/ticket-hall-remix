import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { CityCarousel } from "@/components/CityCarousel";
import { SearchBar } from "@/components/SearchBar";
import { Spotlight } from "@/components/core/spotlight";
import { WordRotate } from "@/components/ui/word-rotate";
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
import { getCategoryLabel } from "@/lib/categories";

const features = [
  { icon: CreditCard, title: "Pagamento seguro", desc: "PIX, cartão de crédito e boleto. Checkout rápido e protegido." },
  { icon: Smartphone, title: "Ingresso digital", desc: "QR Code único no celular. Sem necessidade de impressão." },
  { icon: Zap, title: "Entrega instantânea", desc: "Receba seus ingressos por e-mail e na área logada em segundos." },
  { icon: Shield, title: "Garantia de reembolso", desc: "Solicite reembolso facilmente caso o evento seja cancelado." },
  { icon: Users, title: "Transferência fácil", desc: "Transfira ingressos para amigos com apenas um clique." },
  { icon: QrCode, title: "Check-in rápido", desc: "Check-in na entrada do evento com leitura de QR Code." },
];

const faqs = [
  { 
    q: "Como compro ingressos?", 
    a: "Muito simples! Acesse a página do evento, escolha o tipo de ingresso e quantidade desejada. No checkout, informe seus dados e finalize com PIX (aprovação instantânea), cartão de crédito (em até 12x) ou boleto bancário. Seus ingressos chegam por e-mail em segundos!" 
  },
  { 
    q: "Posso transferir meu ingresso?", 
    a: "Sim! Na área 'Meus Ingressos', clique no botão 'Transferir' do ingresso desejado e informe o e-mail do destinatário. A transferência é gratuita e o novo titular recebe o ingresso digital automaticamente. Você pode acompanhar o status da transferência no seu painel." 
  },
  { 
    q: "Como funciona o reembolso?", 
    a: "Se o evento for cancelado pelo produtor, o reembolso é automático e integral em até 5 dias úteis. Para outros casos (mudança de data, desistência), você pode solicitar reembolso através do painel 'Meus Ingressos' em até 7 dias antes do evento, sujeito à política de cada produtor." 
  },
  { 
    q: "Meu ingresso é digital ou preciso imprimir?", 
    a: "Todos os ingressos do TicketHall são 100% digitais! Você recebe um QR Code único que fica no seu celular. Na entrada do evento, basta mostrar o QR Code na tela para fazer o check-in. Sem necessidade de impressão, mais sustentável e prático!" 
  },
  { 
    q: "Como funciona o check-in no evento?", 
    a: "É super rápido! Na entrada do evento, abra o e-mail com seu ingresso ou acesse 'Meus Ingressos' no site. Mostre o QR Code na tela do celular para o organizador escanear. O sistema valida automaticamente e libera sua entrada. Lembre-se de ter o documento de identidade em mãos!" 
  },
  { 
    q: "O que é a fila virtual?", 
    a: "Para eventos com alta demanda, alguns produtores ativam a fila virtual. Você entra na fila antes das vendas começarem e aguarda sua vez de comprar. Isso garante uma experiência mais justa e evita que o site trave. Você recebe notificações sobre sua posição na fila." 
  },
  { 
    q: "Posso comprar para outras pessoas?", 
    a: "Sim! Durante a compra, você pode informar os dados de diferentes pessoas para cada ingresso. Cada ingresso terá o nome do titular para o check-in. Alternativamente, você pode comprar em seu nome e depois transferir os ingressos gratuitamente." 
  },
  { 
    q: "É seguro comprar pelo TicketHall?", 
    a: "Completamente seguro! Utilizamos criptografia de ponta a ponta, não armazenamos dados do seu cartão, seguimos a LGPD rigorosamente e monitoramos transações 24/7 para prevenir fraudes. Todos os pagamentos são processados por gateways certificados e reconhecidos pelo Banco Central." 
  },
  { 
    q: "Posso parcelar minha compra?", 
    a: "Sim! Aceitamos cartão de crédito em até 12x sem juros (sujeito à análise do emissor do cartão). Também oferecemos PIX com aprovação instantânea e boleto bancário com vencimento em 3 dias úteis. Escolha a forma que melhor se adequa ao seu orçamento." 
  },
  { 
    q: "E se eu perder meu ingresso ou deletar o e-mail?", 
    a: "Sem problemas! Seus ingressos ficam salvos para sempre na área 'Meus Ingressos' do site. Basta fazer login com seu e-mail e senha. Você também pode solicitar o reenvio dos ingressos por e-mail a qualquer momento. Seus ingressos estão sempre seguros conosco!" 
  },
  { 
    q: "Posso alterar meus dados após a compra?", 
    a: "Dados como nome do titular e documento podem ser alterados através da área 'Meus Ingressos' até 24 horas antes do evento. Para outras alterações ou dúvidas específicas, entre em contato com o atendimento do evento através dos dados disponíveis na página do evento." 
  },
  { 
    q: "Como sei se minha compra foi aprovada?", 
    a: "Você recebe confirmação por e-mail imediatamente após a aprovação do pagamento. PIX é instantâneo, cartão leva até alguns minutos, e boleto até 3 dias úteis. Você pode acompanhar o status em tempo real na área 'Meus Ingressos' e recebe notificações por e-mail sobre qualquer mudança." 
  }
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
      buyer: "/eventos",
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
            className="font-display text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight"
          >
            Seus ingressos para{" "}
            <WordRotate
              words={["shows", "festivais", "eventos", "summits", "teatros", "congressos", "workshops"]}
              duration={2500}
              className="text-primary"
            />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Compre, transfira e gerencie seus ingressos com segurança. A plataforma completa para produtores e compradores.
          </motion.p>

          {/* Hero Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="max-w-2xl mx-auto w-full"
          >
            <SearchBar variant="hero" placeholder="Buscar eventos, shows, cidades..." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
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

      {/* ===== CATEGORY CAROUSEL ===== */}
      <CategoryCarousel className="bg-secondary/30" />

      {/* ===== FEATURED EVENTS ===== */}
      <section className="py-16 lg:py-24">
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

      {/* ===== CITY CAROUSEL ===== */}
      <CityCarousel className="bg-secondary/30" />

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
