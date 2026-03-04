import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";

type ChangelogTag = {
  label: string;
  variant?: "default" | "secondary" | "outline";
};

type ChangelogEntry = {
  date: string;
  version: string;
  title: string;
  tags: ChangelogTag[];
  highlights: string[];
  features?: string[];
  fixes?: string[];
};

const changelog: ChangelogEntry[] = [
  {
    date: "4 Mar 2026",
    version: "1.0",
    title: "Lançamento Oficial — TicketHall v1.0",
    tags: [
      { label: "Lançamento", variant: "default" },
      { label: "Plataforma", variant: "secondary" },
      { label: "Pagamentos", variant: "outline" },
    ],
    highlights: [
      "Plataforma completa de venda de ingressos com taxa de apenas 7%",
      "Painel do produtor com relatórios em tempo real, cupons e gestão de lotes",
      "Check-in por QR Code com suporte offline e sincronização automática",
      "Sistema de pagamentos via PIX, cartão de crédito e boleto bancário",
    ],
    features: [
      "Página de evento otimizada para SEO e compartilhamento",
      "Fila virtual com admissão em lotes para eventos de alta demanda",
      "Certificados de participação gerados automaticamente pós-evento",
      "Suporte a ingressos multi-day com datas válidas configuráveis",
      "Meia-entrada com validação de documento (estudante, PcD, idoso)",
      "Seguro de ingresso opcional no checkout",
      "Sistema de afiliados e cupons de desconto para produtores",
      "Guest list com check-in independente",
      "Webhooks para integração com sistemas externos",
      "Widget embeddable para venda em sites de terceiros",
    ],
    fixes: [
      "Validação de CEP e preenchimento automático de endereço",
      "Correção no cálculo de taxas quando há cupom + seguro",
      "Tratamento de CORS em todas as funções de backend",
    ],
  },
  {
    date: "28 Fev 2026",
    version: "0.9",
    title: "Beta Fechado — Infraestrutura e Segurança",
    tags: [
      { label: "Segurança", variant: "default" },
      { label: "LGPD", variant: "secondary" },
      { label: "Backend", variant: "outline" },
    ],
    highlights: [
      "Conformidade total com LGPD — consentimentos, exportação e exclusão de dados",
      "Sistema de autenticação com verificação de e-mail obrigatória",
      "Row-Level Security em todas as tabelas do banco de dados",
      "Rate limiting e proteção contra abusos nas APIs",
    ],
    features: [
      "Painel administrativo com gestão de eventos, produtores e finanças",
      "Sistema de notificações em tempo real",
      "Transferência de ingressos entre usuários",
      "Reembolso parcial e total com rastreamento",
      "Perfil público do organizador com personalização",
    ],
  },
  {
    date: "15 Fev 2026",
    version: "0.5",
    title: "Primeiros Módulos — Eventos e Checkout",
    tags: [
      { label: "UI/UX", variant: "default" },
      { label: "Checkout", variant: "secondary" },
    ],
    highlights: [
      "Design system com tema dark exclusivo e tipografia Sora + Inter",
      "Fluxo de checkout em 3 etapas: dados → pagamento → confirmação",
      "Landing page para compradores e para produtores",
      "Listagem de eventos com filtros por categoria, cidade e data",
    ],
  },
];

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Changelog — TicketHall"
        description="Acompanhe todas as atualizações, novidades e melhorias da plataforma TicketHall."
      />
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-12 border-b border-border">
        <div className="container max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold"
          >
            Changelog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-3 text-lg"
          >
            Todas as atualizações, novidades e melhorias do TicketHall.
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] md:left-[119px] top-2 bottom-0 w-px bg-border" />

            <div className="space-y-16">
              {changelog.map((entry, idx) => (
                <motion.article
                  key={entry.version}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative grid grid-cols-[1fr] md:grid-cols-[100px_1fr] gap-x-8"
                >
                  {/* Left: date + version */}
                  <div className="hidden md:flex flex-col items-end gap-2 pt-1 pr-4">
                    <time className="text-sm text-muted-foreground whitespace-nowrap">
                      {entry.date}
                    </time>
                    <span className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2.5 py-0.5 text-xs font-mono font-semibold">
                      {entry.version}
                    </span>
                  </div>

                  {/* Dot on timeline */}
                  <div className="absolute left-0 md:left-[116px] top-2 z-10">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                  </div>

                  {/* Right: content */}
                  <div className="pl-8 md:pl-6 space-y-4">
                    {/* Mobile date */}
                    <div className="flex items-center gap-3 md:hidden">
                      <time className="text-sm text-muted-foreground">
                        {entry.date}
                      </time>
                      <span className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2 py-0.5 text-xs font-mono font-semibold">
                        {entry.version}
                      </span>
                    </div>

                    <h2 className="font-display text-xl md:text-2xl font-bold leading-tight">
                      {entry.title}
                    </h2>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge key={tag.label} variant={tag.variant}>
                          {tag.label}
                        </Badge>
                      ))}
                    </div>

                    {/* Highlights */}
                    <ul className="space-y-2">
                      {entry.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              {h.split(" ").slice(0, 2).join(" ")}
                            </strong>{" "}
                            <span className="text-muted-foreground">
                              {h.split(" ").slice(2).join(" ")}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Features */}
                    {entry.features && entry.features.length > 0 && (
                      <div className="pt-2">
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Features
                        </h3>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {entry.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bug Fixes */}
                    {entry.fixes && entry.fixes.length > 0 && (
                      <div className="pt-2">
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Correções
                        </h3>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {entry.fixes.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Separator */}
                    {idx < changelog.length - 1 && (
                      <div className="pt-4 border-b border-border/50" />
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
