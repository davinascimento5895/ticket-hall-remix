import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ChevronDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FeatureKey =
  | "pix" | "debito" | "googleApplePay"
  | "lotes" | "gratuitos" | "cupons"
  | "transferencia" | "listaEspera" | "revenda"
  | "checkinOffline" | "relatorios" | "widget";

interface Platform {
  name: string;
  highlight: boolean;
  badge?: string;
  fee: string;
  feeNumeric: number;
  features: Record<FeatureKey, boolean>;
}

const platforms: Platform[] = [
  {
    name: "TicketHall",
    highlight: true,
    badge: "Melhor custo-benefício",
    fee: "7%",
    feeNumeric: 7,
    features: {
      pix: true, debito: true, googleApplePay: true,
      lotes: true, gratuitos: true, cupons: true,
      transferencia: true, listaEspera: true, revenda: true,
      checkinOffline: true, relatorios: true, widget: true,
    },
  },
  {
    name: "Sympla",
    highlight: false,
    fee: "~10%",
    feeNumeric: 10.18,
    features: {
      pix: true, debito: false, googleApplePay: true,
      lotes: true, gratuitos: true, cupons: true,
      transferencia: true, listaEspera: false, revenda: false,
      checkinOffline: true, relatorios: true, widget: false,
    },
  },
  {
    name: "Ingresse",
    highlight: false,
    fee: "~10,7%",
    feeNumeric: 10.67,
    features: {
      pix: true, debito: true, googleApplePay: true,
      lotes: true, gratuitos: true, cupons: true,
      transferencia: true, listaEspera: false, revenda: false,
      checkinOffline: true, relatorios: true, widget: false,
    },
  },
  {
    name: "ZigBrasil",
    highlight: false,
    fee: "~8,2%",
    feeNumeric: 8.21,
    features: {
      pix: true, debito: true, googleApplePay: true,
      lotes: true, gratuitos: true, cupons: true,
      transferencia: true, listaEspera: false, revenda: false,
      checkinOffline: false, relatorios: true, widget: false,
    },
  },
  {
    name: "Lets.events",
    highlight: false,
    fee: "~8,7%",
    feeNumeric: 8.66,
    features: {
      pix: true, debito: true, googleApplePay: false,
      lotes: true, gratuitos: true, cupons: true,
      transferencia: false, listaEspera: false, revenda: false,
      checkinOffline: true, relatorios: true, widget: false,
    },
  },
  {
    name: "Ticketmaster",
    highlight: false,
    fee: "~18,3%",
    feeNumeric: 18.33,
    features: {
      pix: false, debito: false, googleApplePay: false,
      lotes: true, gratuitos: false, cupons: false,
      transferencia: true, listaEspera: false, revenda: false,
      checkinOffline: true, relatorios: true, widget: false,
    },
  },
];

interface FeatureRow {
  key: FeatureKey;
  label: string;
  tooltip: string;
  category: string;
}

const featureRows: FeatureRow[] = [
  // Pagamentos
  { key: "pix", label: "PIX", tooltip: "Pagamento instantâneo via PIX com confirmação em segundos.", category: "💳 Pagamentos" },
  { key: "debito", label: "Cartão de débito", tooltip: "Aceita cartão de débito como forma de pagamento no checkout.", category: "💳 Pagamentos" },
  { key: "googleApplePay", label: "Google Pay / Apple Pay", tooltip: "Pagamento com carteiras digitais para checkout rápido.", category: "💳 Pagamentos" },
  // Ingressos
  { key: "lotes", label: "Lotes com virada automática", tooltip: "Os lotes avançam automaticamente quando esgotam ou pela data configurada.", category: "🎫 Ingressos" },
  { key: "gratuitos", label: "Ingressos gratuitos", tooltip: "Crie e distribua ingressos de cortesia sem custo adicional.", category: "🎫 Ingressos" },
  { key: "cupons", label: "Cupons de desconto", tooltip: "Crie cupons com valor fixo ou percentual, validade e limite de uso.", category: "🎫 Ingressos" },
  { key: "transferencia", label: "Transferência de ingresso", tooltip: "O comprador pode transferir o ingresso para outra pessoa pela plataforma.", category: "🎫 Ingressos" },
  { key: "listaEspera", label: "Lista de espera (sold out)", tooltip: "Avisa automaticamente quando surgem ingressos para um evento esgotado.", category: "🎫 Ingressos" },
  { key: "revenda", label: "Revenda oficial", tooltip: "Marketplace integrado para revenda segura de ingressos pelo preço original.", category: "🎫 Ingressos" },
  // Operações
  { key: "checkinOffline", label: "Check-in offline", tooltip: "Faça check-in mesmo sem internet. Os dados sincronizam quando a conexão volta.", category: "⚙️ Operações" },
  { key: "relatorios", label: "Relatórios em tempo real", tooltip: "Dashboard com vendas, receita e check-ins atualizando ao vivo.", category: "⚙️ Operações" },
  { key: "widget", label: "Widget incorporável", tooltip: "Embed de venda de ingressos para colocar em qualquer site externo.", category: "⚙️ Operações" },
];

function FeatureCell({ has, isHighlight }: { has: boolean; isHighlight: boolean }) {
  if (has) {
    return (
      <CheckCircle2
        className={`h-5 w-5 ${isHighlight ? "text-accent fill-accent/20" : "text-success"}`}
      />
    );
  }
  return <XCircle className="h-4 w-4 text-muted-foreground/40" />;
}

function FeatureLabel({ feature }: { feature: FeatureRow }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground cursor-help">
          {feature.label}
          <Info className="h-3 w-3 text-muted-foreground/50" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[240px] text-xs">
        {feature.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// Desktop Table
function DesktopTable() {
  let lastCategory = "";

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-elevated">
            <th className="p-4 text-left text-xs font-medium text-muted-foreground min-w-[180px] bg-elevated sticky left-0 z-20">
              Funcionalidade
            </th>
            {platforms.map((p) => (
              <th
                key={p.name}
                className={`p-4 text-center min-w-[100px] ${
                  p.highlight
                    ? "bg-primary/5 border-x-2 border-t-2 border-primary/40"
                    : "bg-elevated"
                }`}
              >
                {p.badge && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full mb-1.5">
                    {p.badge}
                  </span>
                )}
                <div className={`text-sm font-semibold ${p.highlight ? "text-primary" : "text-foreground"}`}>
                  {p.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Fee row */}
          <tr className="border-b border-border bg-muted/30">
            <td className="p-4 text-sm font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10">
              💰 Taxa de serviço
            </td>
            {platforms.map((p) => (
              <td
                key={p.name}
                className={`p-4 text-center ${
                  p.highlight ? "border-x-2 border-primary/40 bg-primary/5" : ""
                }`}
              >
                <span
                  className={`font-display font-bold ${
                    p.highlight
                      ? "text-accent text-lg"
                      : p.feeNumeric > 15
                      ? "text-destructive/80 text-sm"
                      : "text-foreground text-sm"
                  }`}
                >
                  {p.fee}
                </span>
              </td>
            ))}
          </tr>

          {/* Feature rows */}
          {featureRows.map((feature, i) => {
            const showCategory = feature.category !== lastCategory;
            lastCategory = feature.category;

            return (
              <>
                {showCategory && (
                  <tr key={`cat-${feature.category}`} className="border-b border-border">
                    <td
                      colSpan={platforms.length + 1}
                      className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-background"
                    >
                      {feature.category}
                    </td>
                  </tr>
                )}
                <motion.tr
                  key={feature.key}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4 sticky left-0 bg-background z-10">
                    <FeatureLabel feature={feature} />
                  </td>
                  {platforms.map((p) => (
                    <td
                      key={p.name}
                      className={`p-4 ${
                        p.highlight ? "border-x-2 border-primary/40 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <FeatureCell has={p.features[feature.key]} isHighlight={p.highlight} />
                      </div>
                    </td>
                  ))}
                </motion.tr>
              </>
            );
          })}

          {/* Bottom border for highlight column */}
          <tr className="h-0">
            <td />
            {platforms.map((p) => (
              <td
                key={p.name}
                className={p.highlight ? "border-x-2 border-b-2 border-primary/40" : ""}
              />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Mobile Accordion
function MobileAccordion() {
  const tickethall = platforms[0];
  const others = platforms.slice(1);

  const renderPlatformFeatures = (platform: Platform) => {
    let lastCat = "";
    return (
      <div className="space-y-1">
        {/* Fee */}
        <div className="flex justify-between items-center py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Taxa de serviço</span>
          <span className={`font-display font-bold ${platform.highlight ? "text-accent text-lg" : platform.feeNumeric > 15 ? "text-destructive/80" : "text-foreground"}`}>
            {platform.fee}
          </span>
        </div>
        {featureRows.map((f) => {
          const showCat = f.category !== lastCat;
          lastCat = f.category;
          return (
            <div key={f.key}>
              {showCat && (
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                  {f.category}
                </p>
              )}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-foreground">{f.label}</span>
                <FeatureCell has={platform.features[f.key]} isHighlight={platform.highlight} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const totalFeatures = (p: Platform) =>
    Object.values(p.features).filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* TicketHall always expanded */}
      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full mb-1">
              {tickethall.badge}
            </span>
            <h3 className="font-display font-bold text-primary">{tickethall.name}</h3>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-bold text-accent">{tickethall.fee}</span>
            <p className="text-[11px] text-muted-foreground">{totalFeatures(tickethall)}/{featureRows.length} features</p>
          </div>
        </div>
        {renderPlatformFeatures(tickethall)}
      </div>

      <Accordion type="multiple" className="space-y-2">
        {others.map((p) => (
          <AccordionItem key={p.name} value={p.name} className="rounded-xl border border-border bg-card overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-display font-semibold text-sm">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${p.feeNumeric > 15 ? "text-destructive/80" : "text-muted-foreground"}`}>
                    {p.fee}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {totalFeatures(p)}/{featureRows.length}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderPlatformFeatures(p)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export function TabelaComparativo() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-8">
      {isMobile ? <MobileAccordion /> : <DesktopTable />}

      <p className="text-xs text-muted-foreground text-center">
        Dados baseados em pesquisa pública de março de 2025. Funcionalidades e taxas dos concorrentes podem variar. Confirme nas respectivas plataformas.
      </p>

      <div className="flex justify-center">
        <Button asChild variant="hero" size="lg" className="mt-4 w-full max-w-sm md:w-auto">
          <Link to="/produtores/funcionalidades">Ver todas as funcionalidades</Link>
        </Button>
      </div>
    </div>
  );
}
