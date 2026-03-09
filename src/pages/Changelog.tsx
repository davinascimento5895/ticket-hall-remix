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
    date: "9 Mar 2026",
    version: "1.2",
    title: "Gestão Avançada & Produtividade",
    tags: [
      { label: "Gestão", variant: "default" },
      { label: "Produtores", variant: "secondary" },
      { label: "Finanças", variant: "outline" },
    ],
    highlights: [
      "Sistema completo de afiliados com tracking de performance e comissões configuráveis",
      "Mensagens em massa para compradores com segmentação avançada por lote e status",
      "Gestão de equipe com convites por e-mail e controle granular de permissões",
      "Dashboard administrativo com gestão financeira e repasse automático aos produtores",
    ],
    features: [
      "Programa de afiliados: códigos únicos, tracking de cliques/conversões, comissões por percentual",
      "Bulk messaging: envio segmentado por evento, lote, status de pagamento ou check-in",
      "Team management: convites, roles (editor/viewer), controle por evento",
      "Capacity groups: pools de vagas compartilhadas entre múltiplos lotes",
      "Webhooks avançados: HMAC-SHA256, retry exponencial, logs de entrega",
      "Admin financeiro: cálculo automático de repasses, geração de notas fiscais",
      "Guest list independente: importação CSV, check-in sem compra de ingresso",
      "Analytics de evento: métricas de conversão, receita e performance detalhadas",
    ],
  },
  {
    date: "7 Mar 2026",
    version: "1.1",
    title: "Experiência do Usuário & Descoberta",
    tags: [
      { label: "UX", variant: "default" },
      { label: "Descoberta", variant: "secondary" },
      { label: "Suporte", variant: "outline" },
    ],
    highlights: [
      "Onboarding interativo com 3 slides explicando como usar a plataforma",
      "Chat de suporte inteligente com respostas automáticas e FAQ dinâmico",
      "Descoberta aleatória de eventos com botão 'Surpreenda-me'",
      "Sistema de blog completo com posts educativos e novidades da plataforma",
    ],
    features: [
      "Onboarding flow: 3 slides com animações, skip opcional, storage no localStorage",
      "SupportChat: bot com quick replies, FAQ automático, interface conversacional",
      "RandomDiscoveryButton: algoritmo de descoberta aleatória de eventos ativos",
      "Blog system: posts com categorias, SEO otimizado, sistema de tags",
      "Embed widget: incorporação em sites terceiros com configuração personalizável",
      "Configurações de notificação: controle granular por tipo de evento",
      "Calculadora de produtores: comparativo de taxas vs. concorrentes",
      "Páginas legais completas: termos de uso e política de privacidade detalhadas",
      "Perfil público de organizador: landing page dedicada com eventos e informações",
    ],
  },
  {
    date: "4 Mar 2026",
    version: "1.0",
    title: "Lançamento Oficial — TicketHall v1.0",
    tags: [
      { label: "Lançamento", variant: "default" },
      { label: "Plataforma", variant: "secondary" },
      { label: "Full-Stack", variant: "outline" },
    ],
    highlights: [
      "Plataforma completa de venda de ingressos com a menor taxa do Brasil: apenas 7%",
      "Painel do produtor profissional com dashboard, relatórios e gestão completa",
      "Check-in por QR Code com modo offline e sincronização automática",
      "Fila virtual inteligente para eventos de alta demanda com admissão controlada",
    ],
    features: [
      "Certificados de participação com geração automática e código único",
      "Eventos multi-day com datas válidas configuráveis por lote de ingressos",
      "Seguro de ingresso opcional no checkout com cálculo dinâmico de preço",
      "Meia-entrada integrada com campos de documento (estudante, PcD, idoso)",
      "Sistema de cupons avançado com desconto percentual ou valor fixo",
      "Transferência de ingressos entre usuários com histórico completo",
      "Reembolso automatizado para cancelamentos e janela de 7 dias para desistência",
      "Conformidade total com LGPD: exportação de dados e exclusão de conta",
    ],
    fixes: [
      "Correção de CORS headers em todas as 14 edge functions do backend",
      "Fix no fluxo de autenticação: substituição de auth.getClaims() por auth.getUser()",
      "Cálculo correto de posição na fila virtual excluindo entradas expiradas",
    ],
  },
  {
    date: "3 Mar 2026",
    version: "0.9.2",
    title: "Auditoria End-to-End e Correções Críticas",
    tags: [
      { label: "Qualidade", variant: "default" },
      { label: "Bug Fixes", variant: "secondary" },
      { label: "Segurança", variant: "outline" },
    ],
    highlights: [
      "Auditoria completa de todos os componentes implementados",
      "Constraint UNIQUE adicionada em lgpd_consents para evitar conflitos",
      "Função PL/pgSQL confirm_checkin_analytics implementada",
      "Validação robusta em todas as edge functions críticas",
    ],
    features: [
      "Headers x-supabase-client-* adicionados em todas as edge functions",
      "Validação robusta em manage-queue, validate-checkin e generate-certificate",
      "Botão de download funcional na página de certificados",
    ],
    fixes: [
      "Fix de crash em create-payment e generate-invoice por chamada inexistente",
      "Fix no cálculo de posição da fila virtual: filtro por status waiting/admitted",
      "Fix de CORS silencioso (403) em 12 edge functions",
      "Fix no download de certificados — geração correta de arquivos",
    ],
  },
  {
    date: "3 Mar 2026",
    version: "0.9.1",
    title: "Features Avançadas — Fila Virtual & Certificados",
    tags: [
      { label: "Features", variant: "default" },
      { label: "Backend", variant: "secondary" },
      { label: "Checkout", variant: "outline" },
    ],
    highlights: [
      "Fila virtual para eventos de alta demanda com polling em tempo real",
      "Certificados de participação com código único e download automático",
      "Suporte completo a eventos multi-day com gestão de datas",
      "Checkout aprimorado com seguro e campos de meia-entrada",
    ],
    features: [
      "Edge function manage-queue: join, admissão em lotes, expiração automática",
      "Edge function generate-certificate: geração individual e em lote",
      "Página /fila/:slug com sala de espera e countdown de admissão",
      "Página /meus-certificados com listagem e download",
      "Componente HalfPriceFields: documentos de meia-entrada validados",
      "Componente InsuranceToggle: ativação de seguro com preço dinâmico",
      "Campo valid_dates (TIMESTAMPTZ[]) na tabela ticket_tiers para eventos multi-day",
    ],
  },
  {
    date: "2 Mar 2026",
    version: "0.8",
    title: "LGPD, Privacidade e Conformidade Legal",
    tags: [
      { label: "LGPD", variant: "default" },
      { label: "Privacidade", variant: "secondary" },
      { label: "Segurança", variant: "outline" },
    ],
    highlights: [
      "Conformidade total com LGPD — gerenciamento completo de consentimentos",
      "Exportação de dados pessoais em formato JSON via edge function",
      "Exclusão de conta com remoção completa e irreversível de dados",
      "Rate limiting por IP/usuário para proteção contra abusos",
    ],
    features: [
      "Página /minha-conta/privacidade com toggles de consentimento",
      "Edge function lgpd-data: exportação, anonimização e exclusão",
      "Tabelas lgpd_consents e lgpd_data_requests com políticas RLS",
      "Log completo de consentimentos com IP, user-agent e timestamps",
      "Rate limiting configurável para proteção de APIs sensíveis",
    ],
  },
  {
    date: "1 Mar 2026",
    version: "0.7",
    title: "Integrações & Comunicação Profissional",
    tags: [
      { label: "Integrações", variant: "default" },
      { label: "Webhooks", variant: "secondary" },
      { label: "Comunicação", variant: "outline" },
    ],
    highlights: [
      "Sistema de webhooks profissional com retries automáticos",
      "Programa de afiliados com tracking de cliques e conversões",
      "Comunicação em massa para compradores com filtros avançados",
      "Lembretes automáticos de evento via edge function agendável",
    ],
    features: [
      "Edge function dispatch-webhook com retry exponencial (até 5 tentativas)",
      "Edge function event-reminders para envio 24h antes do evento",
      "Gestão de afiliados no painel do produtor com métricas detalhadas",
      "Envio de mensagens segmentadas por lote, status e check-in",
      "Widget embeddable para venda em sites de terceiros",
      "Gerador de snippet HTML/iframe para incorporação",
    ],
  },
  {
    date: "28 Fev 2026",
    version: "0.6",
    title: "Painel Administrativo & Gestão Financeira",
    tags: [
      { label: "Admin", variant: "default" },
      { label: "Finanças", variant: "secondary" },
      { label: "Backend", variant: "outline" },
    ],
    highlights: [
      "Painel administrativo completo com 7 módulos especializados",
      "Sistema de roles (admin, producer, user) com função security definer",
      "Cálculo automático de repasse ao produtor com dedução de taxa",
      "Geração automática de notas fiscais com PDF",
    ],
    features: [
      "Dashboard admin com métricas agregadas: receita, eventos, usuários",
      "Gestão completa de produtores com aprovação/rejeição",
      "Edge function calculate-producer-payout para cálculo de repasses",
      "Edge function generate-invoice para emissão de notas fiscais",
      "Tabela user_roles com enum app_role e políticas RLS",
      "Analytics de evento com métricas agregadas em tempo real",
    ],
  },
  {
    date: "26 Fev 2026", 
    version: "0.5",
    title: "Painel do Produtor & Gestão de Eventos",
    tags: [
      { label: "Produtores", variant: "default" },
      { label: "Dashboard", variant: "secondary" },
      { label: "Eventos", variant: "outline" },
    ],
    highlights: [
      "Painel do produtor profissional com sidebar e 10+ módulos",
      "Criação de eventos com upload de imagens e configuração completa",
      "Relatórios de vendas em tempo real com gráficos interativos",
      "Check-in por QR Code com validação e modo offline",
    ],
    features: [
      "Dashboard com métricas: vendas, receita, check-ins e conversão",
      "Formulário completo de evento com local, datas e categorias",
      "Gestão de lotes com preço, quantidade e período de venda",
      "Sistema de cupons: percentual ou valor fixo, limite de uso",
      "Edge function validate-checkin com validação anti-fraude",
      "Edge function sync-offline-checkins para sincronização",
      "Perfil público do organizador com logo, bio e redes sociais",
      "Grupos de capacidade compartilhada entre lotes",
    ],
  },
  {
    date: "22 Fev 2026",
    version: "0.4",
    title: "Checkout, Pagamentos & Ingressos Digitais",
    tags: [
      { label: "Checkout", variant: "default" },
      { label: "Pagamentos", variant: "secondary" },
      { label: "Ingressos", variant: "outline" },
    ],
    highlights: [
      "Fluxo de checkout profissional em 3 etapas otimizadas",
      "Integração completa: PIX (QR code), cartão e boleto",
      "Ingressos digitais com QR code único enviados por e-mail",
      "Carrinho persistente com suporte a múltiplos eventos",
    ],
    features: [
      "Edge function create-payment para processamento seguro",
      "Edge function asaas-webhook para callbacks de pagamento",
      "Edge function send-ticket-email com envio automático",
      "Página /meus-ingressos com gestão completa",
      "Transferência de ingressos com histórico completo",
      "Sistema de reembolso parcial e total",
      "Perguntas customizadas configuráveis pelo produtor",
      "Validação de CPF e preenchimento automático via CEP",
    ],
  },
  {
    date: "18 Fev 2026",
    version: "0.3", 
    title: "Autenticação, Perfis & Notificações",
    tags: [
      { label: "Auth", variant: "default" },
      { label: "Real-time", variant: "secondary" },
      { label: "Perfis", variant: "outline" },
    ],
    highlights: [
      "Sistema de autenticação seguro com verificação de e-mail",
      "Perfis completos com avatar, dados pessoais e CPF",
      "Notificações em tempo real via Realtime subscriptions",
      "Sistema robusto de roles: admin, producer e user",
    ],
    features: [
      "Modal de autenticação com design responsivo",
      "Contexto global de autenticação com detecção automática",
      "Rotas protegidas por role com redirecionamento inteligente",
      "Trigger automático para criação de perfil de usuário",
      "NotificationBell com badge e dropdown de listagem",
      "Navegação mobile adaptativa com bottom nav",
    ],
  },
  {
    date: "15 Fev 2026",
    version: "0.2",
    title: "Catálogo de Eventos & Sistema de Busca",
    tags: [
      { label: "Eventos", variant: "default" },
      { label: "UI/UX", variant: "secondary" },
      { label: "Busca", variant: "outline" },
    ],
    highlights: [
      "Catálogo de eventos com grid responsivo e cards visuais",
      "Sistema de filtros: categoria, cidade, data e faixa de preço",
      "Páginas de detalhe com informações completas e lotes",
      "Busca inteligente com debounce e resultados instantâneos",
    ],
    features: [
      "Componente EventCard com imagem, categoria e preço",
      "Página /eventos com sidebar de filtros avançados",
      "Página /eventos/:slug com banner e descrição completa",
      "Componente TicketTierCard com seleção de quantidade",
      "Countdown timer para início e encerramento de vendas",
      "6 categorias: Música, Esportes, Teatro, Festas, Corporativo, Educação",
      "SEOHead com meta tags dinâmicas otimizadas",
    ],
  },
  {
    date: "10 Fev 2026",
    version: "0.1",
    title: "Fundação — Design System & Infraestrutura",
    tags: [
      { label: "Design System", variant: "default" },
      { label: "Infraestrutura", variant: "secondary" },
      { label: "Base", variant: "outline" },
    ],
    highlights: [
      "Design system dark-first com tokens semânticos profissionais",
      "Tipografia premium: Sora (display) + Inter (body) via Google Fonts",
      "Biblioteca completa baseada em shadcn/ui + Radix primitives",
      "Estrutura sólida: React, Vite, TypeScript e Tailwind CSS",
    ],
    features: [
      "Paleta harmoniosa: primary (indigo), accent (amber), superfícies escalonadas",
      "30+ componentes UI: Button, Card, Badge, Dialog, Accordion, Tabs",
      "Navbar fixa com blur no scroll e navegação responsiva",
      "Footer organizado com links por seção",
      "Roteamento via React Router v6 com lazy loading",
      "Integração nativa com Lovable Cloud para backend serverless",
      "Configuração Tailwind com tokens customizados e animações suaves",
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <SEOHead
        title="Changelog — TicketHall"
        description="Acompanhe todas as atualizações, novidades e melhorias da plataforma TicketHall."
      />

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

    </>
  );
}
