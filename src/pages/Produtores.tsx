import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CalculadoraComparador } from "@/components/CalculadoraComparador";
import { TabelaComparativo } from "@/components/TabelaComparativo";

import { BecomeProducerModal } from "@/components/BecomeProducerModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  Layers,
  QrCode,
  BarChart3,
  Tag,
  Gift,
  Globe,
  ArrowRight,
  Users,
  Monitor,
  Building2,
  Shield,
  Lock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { id: "lotes", icon: Layers, title: "Lotes e combos", desc: "Crie diferentes lotes com preços e quantidades independentes. Monte combos com itens extras." },
  { id: "qr", icon: QrCode, title: "QR Code + Check-in", desc: "Cada ingresso tem um QR Code único. Faça check-in em segundos, mesmo offline." },
  { id: "reports", icon: BarChart3, title: "Relatórios em tempo real", desc: "Acompanhe vendas, receita e check-ins ao vivo no painel do produtor." },
  { id: "coupons", icon: Tag, title: "Cupons de desconto", desc: "Crie cupons com percentual ou valor fixo, limite de uso e validade personalizada." },
  { id: "free", icon: Gift, title: "Ingressos gratuitos", desc: "Distribua cortesias e convites pelo sistema com controle total." },
  { id: "page", icon: Globe, title: "Página do evento", desc: "Cada evento ganha uma página otimizada, pronta para compartilhar nas redes." },
];

const eventTypes = [
  {
    id: "presencial",
    icon: Users,
    title: "Eventos presenciais",
    desc: "Venda por lotes, valide ingressos com check-in ágil e tenha controle de entrada em tempo real.",
  },
  {
    id: "online",
    icon: Monitor,
    title: "Cursos e eventos online",
    desc: "Comercialize acessos para conteúdos ao vivo ou gravados com experiência simples para seu público.",
  },
  {
    id: "corporativo",
    icon: Building2,
    title: "Eventos corporativos",
    desc: "Gerencie inscrições, listas de convidados e operação completa de workshops, feiras e conferências.",
  },
];

const securityItems = [
  {
    id: "fraude",
    icon: Shield,
    title: "Monitoramento antifraude",
    desc: "Análises contínuas para reduzir riscos em transações e garantir mais segurança nas vendas.",
  },
  {
    id: "dados",
    icon: Lock,
    title: "Dados protegidos",
    desc: "Boas práticas de proteção de dados e privacidade para uma operação confiável.",
  },
  {
    id: "pagamento",
    icon: CreditCard,
    title: "Pagamentos confiáveis",
    desc: "Fluxo de pagamento seguro para compradores e gestão mais tranquila para produtores.",
  },
  {
    id: "transmissao",
    icon: CheckCircle2,
    title: "Transmissão segura",
    desc: "Comunicação protegida durante toda a jornada para manter sua operação estável.",
  },
];

const faqItems = [
  {
    id: "faq-1",
    question: "Quanto custa usar a plataforma para vender ingressos?",
    answer:
      "A cobrança é percentual sobre as vendas realizadas. Não há mensalidade obrigatória para começar, e você acompanha os valores com transparência no painel do produtor.",
  },
  {
    id: "faq-2",
    question: "Como funciona o repasse dos valores das vendas?",
    answer:
      "Os repasses seguem o fluxo configurado para o seu evento e ficam visíveis no financeiro. Você acompanha o status de cada venda e tem previsibilidade para planejar caixa e fornecedores.",
  },
  {
    id: "faq-3",
    question: "Posso criar eventos gratuitos e pagos na mesma conta?",
    answer:
      "Sim. Você pode publicar eventos gratuitos, pagos ou mistos, criar diferentes tipos de ingressos e organizar lotes com regras específicas conforme a estratégia do seu evento.",
  },
  {
    id: "faq-4",
    question: "Consigo personalizar lotes, viradas e cupons de desconto?",
    answer:
      "Sim. É possível configurar lotes com quantidades e preços diferentes, controlar viradas por data e horário e aplicar cupons por valor fixo ou percentual com limite e validade.",
  },
  {
    id: "faq-5",
    question: "Como funciona o check-in no dia do evento?",
    answer:
      "O check-in é feito por leitura de QR Code, com validação rápida para evitar filas. Você também pode acompanhar entradas em tempo real para ter visão clara da operação na porta.",
  },
  {
    id: "faq-6",
    question: "Dá para ter equipe com acessos diferentes para operar o evento?",
    answer:
      "Sim. Você pode organizar a operação com membros de equipe e permissões por função, separando responsabilidades como check-in, atendimento e gestão do evento.",
  },
  {
    id: "faq-7",
    question: "Consigo vender itens extras além do ingresso?",
    answer:
      "Sim. Você pode adicionar produtos e serviços complementares para aumentar o ticket médio, como experiências, itens promocionais e outros adicionais do evento.",
  },
  {
    id: "faq-8",
    question: "A plataforma oferece suporte para quem está começando?",
    answer:
      "Sim. O fluxo de criação é guiado, com recursos pensados para facilitar publicação, gestão e acompanhamento das vendas mesmo para quem está organizando o primeiro evento.",
  },
];

const steps = [
  { step: "01", title: "Crie sua conta", desc: "Cadastro rápido e gratuito. Sem cartão de crédito." },
  { step: "02", title: "Configure seu evento", desc: "Adicione informações, crie lotes e personalize a página." },
  { step: "03", title: "Divulgue o link", desc: "Compartilhe nas redes sociais e comece a vender." },
  { step: "04", title: "Receba na sua conta", desc: "Repasses automáticos após o evento. Simples assim." },
];

export default function Produtores() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [producerModalOpen, setProducerModalOpen] = useState(false);

  const handleCTA = () => {
    if (role === "producer") {
      navigate("/producer/dashboard");
      return;
    }
    setProducerModalOpen(true);
  };

  // Determine button label/state
  const getButtonContent = () => {
    if (role === "producer") {
      return { label: "Acessar painel", icon: ArrowRight };
    }
    return { label: "Criar minha conta de produtor", icon: null };
  };

  const buttonContent = getButtonContent();

  return (
    <>
      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={(open) => {
          setAuthModalOpen(open);
          // After successful auth, open producer modal
          if (!open && user && role !== "producer") {
            setTimeout(() => setProducerModalOpen(true), 300);
          }
        }}
        defaultTab="register"
      />

      {/* Become Producer Modal */}
      <BecomeProducerModal
        open={producerModalOpen}
        onOpenChange={setProducerModalOpen}
      />

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
              <span className="text-primary">produtores de eventos.</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={1} variants={fadeUp} className="text-lg text-muted-foreground">
              Enquanto outros cobram 10% a 20%, nós cobramos apenas{" "}
              <span className="text-accent font-bold text-xl">7%</span>. Simples, transparente, justo.
            </motion.p>
            <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
              <Button
                variant="hero"
                size="xl"
                onClick={handleCTA}
              >
                {buttonContent.label}
                {buttonContent.icon && <buttonContent.icon className="h-5 w-5 ml-2" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TIPOS DE EVENTO */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Do intimista ao grande porte</h2>
            <p className="text-muted-foreground">
              A estrutura para diferentes formatos de evento, com flexibilidade para vender e operar com confiança.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {eventTypes.map((type, i) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <type.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold">{type.title}</h3>
                <p className="text-sm text-muted-foreground">{type.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TABELA COMPARATIVO */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Compare e decida.</h2>
            <p className="text-muted-foreground">
              Menor taxa e mais funcionalidades. Veja como o TicketHall se compara ao mercado.
            </p>
          </motion.div>
          <TabelaComparativo />
        </div>
      </section>

      {/* CALCULADORA */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Ingresso mais barato para quem compra.{" "}
              <span className="text-gradient-brand">Mais vendas para quem produz.</span>
            </h2>
            <p className="text-muted-foreground">
              No TicketHall, a taxa de 7% é a menor do mercado. Isso significa que o preço final que seu comprador vê é menor do que em qualquer outra plataforma — e ingresso mais barato converte mais.
            </p>
          </motion.div>
          <CalculadoraComparador />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Tudo que você precisa para vender ingressos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.id}
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

      {/* SEGURANÇA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Venda com segurança do início ao fim</h2>
            <p className="text-muted-foreground">
              Estrutura pensada para proteger sua operação, suas vendas e a experiência de quem compra.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {securityItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 space-y-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-base">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
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

      {/* FAQ PRODUTORES */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Perguntas frequentes para produtores</h2>
            <p className="text-muted-foreground">
              Tudo o que você precisa saber para começar a vender, operar seu evento e acompanhar seus resultados.
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full rounded-xl border border-border bg-card px-6">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left font-display text-base">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
          <Button
            variant="hero"
            size="xl"
            onClick={handleCTA}
          >
            {role === "producer" ? "Acessar painel" : "Começar a vender grátis"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>
    </>
  );
}
