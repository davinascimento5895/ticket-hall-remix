import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import { Spotlight } from "@/components/core/spotlight";
import { TextEffect } from "@/components/core/text-effect";
import { TextLoop } from "@/components/core/text-loop";
import {
  CreditCard, Smartphone, Zap,
  Music, Trophy, Theater, PartyPopper, Building2, GraduationCap,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedBackground } from "@/components/core/animated-background";

const featuredEvents = [
  { title: "Lollapalooza Brasil 2025", date: "28 Mar 2025", city: "São Paulo, SP", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", priceFrom: 450, category: "music" },
  { title: "Stand Up Comedy — Fábio Porchat", date: "15 Abr 2025", city: "Rio de Janeiro, RJ", imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&q=80", priceFrom: 80, category: "theater" },
  { title: "Final Copa do Brasil", date: "10 Mai 2025", city: "Belo Horizonte, MG", imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80", priceFrom: 120, category: "sports" },
  { title: "Festival Gastronômico BH", date: "22 Jun 2025", city: "Belo Horizonte, MG", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", priceFrom: 0, category: "festival" },
  { title: "Tech Summit Brasil", date: "05 Jul 2025", city: "Florianópolis, SC", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", priceFrom: 250, category: "corporate" },
  { title: "Sertanejo in Rio", date: "18 Ago 2025", city: "Rio de Janeiro, RJ", imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", priceFrom: 90, category: "music" },
];

const categories = [
  { label: "Música", icon: Music },
  { label: "Esportes", icon: Trophy },
  { label: "Teatro", icon: Theater },
  { label: "Festas", icon: PartyPopper },
  { label: "Corporativo", icon: Building2 },
  { label: "Educação", icon: GraduationCap },
];

const testimonials = [
  { name: "Renata Silva", role: "Produtora de eventos", text: "Migrei da Sympla e economizei mais de R$ 12.000 em taxas no primeiro trimestre. A plataforma é intuitiva e o suporte é rápido." },
  { name: "Lucas Mendes", role: "Comprador", text: "A experiência de compra é muito mais fluida. PIX instantâneo e o ingresso fica disponível na hora no celular." },
  { name: "Mariana Costa", role: "Produtora de festivais", text: "O check-in por QR Code funcionou perfeitamente para 3.000 pessoas. Nunca tive problemas. Recomendo demais." },
];

const faqItems = [
  { q: "Qual é a taxa cobrada pelo TicketHall?", a: "Cobramos apenas 7% sobre cada ingresso vendido — a menor taxa do Brasil. Não há mensalidades, taxas de setup ou custos ocultos." },
  { q: "Como recebo meus pagamentos?", a: "Os valores das vendas são depositados diretamente na sua conta bancária ou via PIX, com repasses automáticos após o evento." },
  { q: "Quais formas de pagamento são aceitas?", a: "PIX, cartão de crédito (com parcelamento), cartão de débito e boleto bancário." },
  { q: "Posso transferir meu ingresso para outra pessoa?", a: "Sim! Basta acessar 'Meus Ingressos' e usar a função de transferência. O destinatário recebe o ingresso no e-mail cadastrado." },
  { q: "E se o evento for cancelado?", a: "Em caso de cancelamento pelo produtor, o reembolso é feito automaticamente pelo mesmo método de pagamento, em até 7 dias úteis." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <Spotlight size={500} className="z-0" />
        <div className="container relative z-10 text-center px-4 pt-24 pb-16">
          <div className="space-y-6 max-w-3xl mx-auto">
            <TextEffect
              per="word"
              preset="fade-in-blur"
              speedReveal={1.1}
              as="h1"
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-foreground"
            >
              Seus eventos, do jeito certo.
            </TextEffect>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              A plataforma de ingressos com a menor taxa do Brasil — apenas{" "}
              <span className="text-primary font-semibold">7%</span>
              {" "}para{" "}
              <TextLoop interval={2.5} className="text-foreground font-medium">
                <span>shows</span>
                <span>festivais</span>
                <span>peças</span>
                <span>cursos</span>
                <span>eventos</span>
              </TextLoop>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button size="xl" asChild>
                <Link to="/eventos">Explorar Eventos</Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/produtores">Vender Ingressos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="border-y border-border">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Zap, text: "R$ 0 cobrado até vender" },
              { icon: CreditCard, text: "7% de taxa — a menor do Brasil" },
              { icon: CreditCard, text: "PIX, cartão e boleto" },
              { icon: Smartphone, text: "App iOS & Android em breve" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED EVENTS ===== */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Eventos em Destaque</h2>
              <p className="text-muted-foreground mt-1 text-sm">Os melhores eventos acontecendo agora</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex text-sm">
              <Link to="/eventos">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredEvents.map((event, i) => (
              <EventCard key={i} {...event} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/eventos">Ver todos os eventos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 md:py-20 border-y border-border">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-3xl mx-auto">
            {[
              { step: "01", title: "Encontre seu evento", desc: "Pesquise por nome, cidade ou categoria e descubra os melhores eventos perto de você." },
              { step: "02", title: "Escolha seus ingressos", desc: "Selecione o lote, quantidade e pague com PIX, cartão ou boleto de forma segura." },
              { step: "03", title: "Receba no celular", desc: "Seu ingresso com QR Code chega instantaneamente no seu e-mail e na plataforma." },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-3">
                <span className="text-xs font-mono text-muted-foreground tracking-widest">{item.step}</span>
                <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR PRODUCERS CTA ===== */}
      <section className="py-16 md:py-20">
        <div className="container text-center max-w-2xl mx-auto space-y-5">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Você produz. Nós cuidamos dos ingressos.
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie seu evento em minutos e venda para todo o Brasil. Taxa de apenas 7% — e nada mais.
          </p>
          <Button size="xl" asChild>
            <Link to="/produtores">Começar a vender grátis</Link>
          </Button>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-16 md:py-20 border-y border-border">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Explore por categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <AnimatedBackground
              className="rounded-xl bg-primary/10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              enableHover
            >
              {categories.map((cat, i) => (
                <div
                  key={i}
                  data-id={cat.label}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 cursor-pointer transition-colors duration-150"
                >
                  <cat.icon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
              ))}
            </AnimatedBackground>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 md:py-20">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">O que dizem nossos usuários</h2>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}
