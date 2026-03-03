import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EventCard } from "@/components/EventCard";
import {
  Search, CreditCard, Smartphone, Zap,
  Music, Trophy, Theater, PartyPopper, Building2, GraduationCap, ChevronDown,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mock featured events
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-hero-gradient overflow-hidden">
        {/* Subtle animated circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 -top-40 -left-40 blur-3xl" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-accent/5 -bottom-20 -right-20 blur-3xl" />
        </div>

        <div className="container relative z-10 text-center px-4 pt-20">
          <motion.div initial="hidden" animate="visible" className="space-y-6 max-w-3xl mx-auto">
            <motion.h1
              custom={0}
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Seus eventos,{" "}
              <span className="text-gradient-brand">do jeito certo.</span>
            </motion.h1>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
            >
              A plataforma de ingressos com a menor taxa do Brasil — apenas{" "}
              <span className="text-accent font-semibold">7%</span>.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/eventos">Explorar Eventos</Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/produtores">Vender Ingressos</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="border-y border-border bg-surface">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Zap, text: "R$ 0 cobrado até vender" },
              { icon: CreditCard, text: "7% de taxa — a menor do Brasil" },
              { icon: CreditCard, text: "PIX, cartão e boleto" },
              { icon: Smartphone, text: "App iOS & Android em breve" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED EVENTS ===== */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Eventos em Destaque</h2>
              <p className="text-muted-foreground mt-1">Os melhores eventos acontecendo agora</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link to="/eventos">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <EventCard {...event} />
              </motion.div>
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
      <section className="py-16 md:py-24 bg-surface">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "1", icon: Search, title: "Encontre seu evento", desc: "Pesquise por nome, cidade ou categoria e descubra os melhores eventos perto de você." },
              { step: "2", icon: CreditCard, title: "Escolha seus ingressos", desc: "Selecione o lote, quantidade e pague com PIX, cartão ou boleto de forma segura." },
              { step: "3", icon: Smartphone, title: "Receba no celular", desc: "Seu ingresso com QR Code chega instantaneamente no seu e-mail e na plataforma." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR PRODUCERS CTA ===== */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="container relative z-10 text-center max-w-2xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Você produz. Nós cuidamos dos ingressos.
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie seu evento em minutos e venda para todo o Brasil. Taxa de apenas 7% — e nada mais.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/produtores">Começar a vender grátis</Link>
          </Button>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Explore por categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 cursor-pointer hover:border-primary/40 hover:shadow-card-hover transition-all duration-200"
              >
                <cat.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{cat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">O que dizem nossos usuários</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 md:py-24 bg-surface">
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
