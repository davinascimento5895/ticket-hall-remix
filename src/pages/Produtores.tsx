import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FeeCalculator } from "@/components/FeeCalculator";
import {
  Layers, QrCode, BarChart3, Tag, Gift, Globe,
  Check, ArrowRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: Layers, title: "Lotes e combos", desc: "Crie diferentes lotes com preços e quantidades independentes. Monte combos com itens extras." },
  { icon: QrCode, title: "QR Code + Check-in", desc: "Cada ingresso tem um QR Code único. Faça check-in em segundos, mesmo offline." },
  { icon: BarChart3, title: "Relatórios em tempo real", desc: "Acompanhe vendas, receita e check-ins ao vivo no painel do produtor." },
  { icon: Tag, title: "Cupons de desconto", desc: "Crie cupons com percentual ou valor fixo, limite de uso e validade personalizada." },
  { icon: Gift, title: "Ingressos gratuitos", desc: "Distribua cortesias e convites pelo sistema com controle total." },
  { icon: Globe, title: "Página do evento", desc: "Cada evento ganha uma página otimizada, pronta para compartilhar nas redes." },
];

const competitors = [
  { name: "TicketHall", fee: "7%", highlight: true },
  { name: "Sympla", fee: "~10%", highlight: false },
  { name: "Eventbrite", fee: "10% + taxa fixa", highlight: false },
  { name: "Ingresse", fee: "~12,5%", highlight: false },
  { name: "Bilheteria Digital", fee: "até 15%", highlight: false },
];

const steps = [
  { step: "01", title: "Crie sua conta", desc: "Cadastro rápido e gratuito. Sem cartão de crédito." },
  { step: "02", title: "Configure seu evento", desc: "Adicione informações, crie lotes e personalize a página." },
  { step: "03", title: "Divulgue o link", desc: "Compartilhe nas redes sociais e comece a vender." },
  { step: "04", title: "Receba na sua conta", desc: "Repasses automáticos após o evento. Simples assim." },
];

export default function Produtores() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[80vh] flex items-center bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 -top-32 right-0 blur-3xl" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-accent/5 bottom-0 -left-20 blur-3xl" />
        </div>
        <div className="container relative z-10 pt-24 pb-16">
          <div className="max-w-2xl space-y-6">
            <motion.h1 initial="hidden" animate="visible" custom={0} variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1]">
              A menor taxa do Brasil para{" "}
              <span className="text-gradient-brand">produtores de eventos.</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={1} variants={fadeUp} className="text-lg text-muted-foreground">
              Enquanto outros cobram 10% a 15%, nós cobramos apenas{" "}
              <span className="text-accent font-bold text-xl">7%</span>. Simples, transparente, justo.
            </motion.p>
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              <Button variant="hero" size="xl">
                Criar minha conta de produtor
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEE COMPARISON */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Compare as taxas</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="text-left text-sm font-medium text-muted-foreground p-4">Plataforma</th>
                  <th className="text-right text-sm font-medium text-muted-foreground p-4">Taxa por ingresso</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${c.highlight ? "bg-primary/5" : ""}`}>
                    <td className="p-4">
                      <span className={`text-sm font-semibold ${c.highlight ? "text-primary" : "text-foreground"}`}>
                        {c.name}
                        {c.highlight && <Check className="inline h-4 w-4 ml-2 text-success" />}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-sm font-bold ${c.highlight ? "text-primary" : "text-muted-foreground"}`}>{c.fee}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Valores aproximados baseados em pesquisa pública. Confirme nas plataformas.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Tudo que você precisa para vender ingressos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container max-w-2xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">Calcule sua receita</h2>
          <p className="text-muted-foreground text-center mb-10">Veja quanto você economiza com a menor taxa do Brasil.</p>
          <FeeCalculator />
        </div>
      </section>

      {/* STEPS */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">Como começar</h2>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 items-start"
              >
                <span className="shrink-0 font-display text-3xl font-bold text-primary/30">{s.step}</span>
                <div>
                  <h3 className="font-display font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="container relative z-10 text-center max-w-2xl mx-auto space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Pronto para vender com a menor taxa do Brasil?
          </h2>
          <p className="text-muted-foreground text-lg">Comece grátis agora. Sem mensalidades, sem surpresas.</p>
          <Button variant="hero" size="xl">
            Começar a vender grátis <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
