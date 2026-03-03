import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const competitors = [
  { name: "Sympla", fee: 0.1018 },
  { name: "Ingresse", fee: 0.1067 },
  { name: "ZigBrasil", fee: 0.0821 },
  { name: "Ticketmaster", fee: 0.1833 },
];

const TICKETHALL_FEE = 0.07;

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) { setDisplay(value); return; }
    const duration = 400;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {suffix}
    </span>
  );
}

// Mobile: card-based layout per platform
function MobileComparisonCards({ rows, basePrice }: { rows: ReturnType<typeof useRows>; basePrice: number }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        O que seu comprador paga
      </p>
      {rows.map((row, i) => (
        <motion.div
          key={row.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-lg border p-3 ${
            row.highlight
              ? "border-accent/40 bg-accent/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold inline-flex items-center gap-1.5 ${row.highlight ? "text-accent" : "text-foreground"}`}>
              {row.highlight && <CheckCircle2 className="h-4 w-4 text-accent" />}
              {row.name}
            </span>
            <span className={`text-xs font-bold ${row.highlight ? "text-accent" : "text-muted-foreground"}`}>
              {row.feeLabel}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">Preço final</span>
            <span className="text-sm font-display font-bold text-foreground">
              R$ <AnimatedNumber value={row.finalPrice} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Custo extra</span>
            <span className={`text-xs ${row.highlight ? "text-accent font-bold" : "text-muted-foreground"}`}>
              +R$ <AnimatedNumber value={row.extraCost} />
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Desktop: compact table
function DesktopComparisonTable({ rows }: { rows: ReturnType<typeof useRows> }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-elevated px-4 py-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          O que seu comprador paga em cada plataforma
        </h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Plataforma</th>
            <th className="px-4 py-2.5 font-medium">Taxa</th>
            <th className="px-4 py-2.5 font-medium">Preço final</th>
            <th className="px-4 py-2.5 font-medium text-right">Custo extra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.name}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`border-b border-border last:border-0 transition-colors ${
                row.highlight
                  ? "bg-accent/5 border-l-2 border-l-accent"
                  : "hover:bg-muted/30"
              }`}
            >
              <td className="px-4 py-2.5">
                <span className={`text-sm font-semibold inline-flex items-center gap-1.5 ${row.highlight ? "text-accent" : "text-foreground"}`}>
                  {row.highlight && <CheckCircle2 className="h-4 w-4 text-accent" />}
                  {row.name}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={`text-sm font-bold ${row.highlight ? "text-accent" : "text-muted-foreground"}`}>
                  {row.feeLabel}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className="text-sm font-display font-bold text-foreground">
                  R$ <AnimatedNumber value={row.finalPrice} />
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className={`text-sm ${row.highlight ? "text-accent font-bold" : "text-muted-foreground"}`}>
                  +R$ <AnimatedNumber value={row.extraCost} />
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useRows(basePrice: number) {
  return useMemo(() => {
    const tickethall = {
      name: "TicketHall",
      fee: TICKETHALL_FEE,
      feeLabel: "7%",
      finalPrice: basePrice * (1 + TICKETHALL_FEE),
      extraCost: basePrice * TICKETHALL_FEE,
      highlight: true,
    };

    const others = competitors
      .map((c) => ({
        name: c.name,
        fee: c.fee,
        feeLabel: `~${(c.fee * 100).toFixed(c.fee === 0.1833 ? 2 : c.fee === 0.1067 ? 2 : 0).replace(".", ",")}%`,
        finalPrice: basePrice * (1 + c.fee),
        extraCost: basePrice * c.fee,
        highlight: false,
      }))
      .sort((a, b) => a.fee - b.fee);

    return [tickethall, ...others];
  }, [basePrice]);
}

export function CalculadoraComparador() {
  const [basePrice, setBasePrice] = useState(100);
  const [ticketCount, setTicketCount] = useState(500);
  const resultRef = useRef(null);
  const isInView = useInView(resultRef, { once: false, amount: 0.3 });
  const isMobile = useIsMobile();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    const num = parseInt(raw || "0", 10) / 100;
    setBasePrice(Math.min(Math.max(num, 0), 5000));
  };

  const fmtInput = (v: number) =>
    v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = useRows(basePrice);

  const maxCompetitorFee = Math.max(...competitors.map((c) => c.fee));
  const savingsPerTicket = basePrice * (maxCompetitorFee - TICKETHALL_FEE);
  const totalSavings = savingsPerTicket * ticketCount;
  const worstName = competitors.find((c) => c.fee === maxCompetitorFee)?.name || "";

  const sliderLabels = [
    { value: 0, label: "0" },
    { value: 1000, label: "1k" },
    { value: 5000, label: "5k" },
    { value: 10000, label: "10k" },
  ];

  return (
    <div className="space-y-5">
      {/* Inputs - more compact */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Preço base do ingresso
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                value={fmtInput(basePrice)}
                onChange={handlePriceChange}
                className="pl-10 text-base font-display font-bold max-w-[200px] h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Ingressos esperados: <span className="text-foreground font-bold font-display">{ticketCount.toLocaleString("pt-BR")}</span>
            </label>
            <Slider
              value={[ticketCount]}
              onValueChange={([v]) => setTicketCount(v)}
              min={0}
              max={10000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              {sliderLabels.map((l) => (
                <span key={l.value}>{l.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison - responsive */}
      {isMobile ? (
        <MobileComparisonCards rows={rows} basePrice={basePrice} />
      ) : (
        <DesktopComparisonTable rows={rows} />
      )}

      {/* Results Block - more compact */}
      {ticketCount > 0 && (
        <motion.div
          ref={resultRef}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 12, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-xl border border-accent/20 bg-accent/5 p-4 md:p-6 text-center space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            Seus compradores economizam até
          </p>
          <p className="text-xl md:text-2xl font-display font-bold text-accent">
            R$ <AnimatedNumber value={savingsPerTicket} /> /ingresso
          </p>
          <p className="text-xs text-muted-foreground">
            vs {worstName}
          </p>
          {!isMobile && <div className="h-px w-12 mx-auto bg-accent/20" />}
          <div className={isMobile ? "pt-1" : ""}>
            <p className="text-sm text-muted-foreground">
              Em <span className="text-foreground font-semibold">{ticketCount.toLocaleString("pt-BR")}</span> ingressos:
            </p>
            <p className="text-2xl md:text-3xl font-display font-bold text-accent">
              ✨ R$ <AnimatedNumber value={totalSavings} /> ✨
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresso mais barato = mais gente comprando.
          </p>
        </motion.div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Taxas dos concorrentes são aproximadas, baseadas em pesquisa pública de março de 2025.
      </p>
    </div>
  );
}
