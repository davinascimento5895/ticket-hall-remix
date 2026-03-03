import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export function FeeCalculator() {
  const [ticketsSold, setTicketsSold] = useState(500);
  const [avgPrice, setAvgPrice] = useState(100);

  const results = useMemo(() => {
    const gross = ticketsSold * avgPrice;
    const ourFee = gross * 0.07;
    const ourNet = gross - ourFee;
    const competitorFee = gross * 0.10;
    const competitorNet = gross - competitorFee;
    return { gross, ourFee, ourNet, competitorFee, competitorNet, savings: competitorFee - ourFee };
  }, [ticketsSold, avgPrice]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Ingressos vendidos: <span className="text-foreground font-bold">{ticketsSold.toLocaleString("pt-BR")}</span>
          </label>
          <Slider
            value={[ticketsSold]}
            onValueChange={([v]) => setTicketsSold(v)}
            min={10}
            max={10000}
            step={10}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Preço médio do ingresso (R$)
          </label>
          <Input
            type="number"
            value={avgPrice}
            onChange={(e) => setAvgPrice(Math.max(0, Number(e.target.value)))}
            className="max-w-[200px]"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-2">
          <p className="text-sm font-medium text-primary">TicketHall (7%)</p>
          <p className="text-3xl font-display font-bold text-foreground">{fmt(results.ourNet)}</p>
          <p className="text-sm text-muted-foreground">Taxa: {fmt(results.ourFee)}</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated p-5 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Concorrente (10%)</p>
          <p className="text-3xl font-display font-bold text-muted-foreground">{fmt(results.competitorNet)}</p>
          <p className="text-sm text-muted-foreground">Taxa: {fmt(results.competitorFee)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 text-center">
        <p className="text-sm text-muted-foreground">Você economiza</p>
        <p className="text-2xl font-display font-bold text-accent">{fmt(results.savings)}</p>
        <p className="text-xs text-muted-foreground">usando TicketHall em vez de um concorrente com 10% de taxa</p>
      </div>
    </div>
  );
}
