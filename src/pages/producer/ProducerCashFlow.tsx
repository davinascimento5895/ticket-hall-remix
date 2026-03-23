import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, Clock, Info } from "lucide-react";
import { getCashFlowSummary } from "@/lib/api-financial";
import { formatBRL } from "@/lib/utils";

export default function ProducerCashFlow({ producerId }: { producerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["cash-flow", producerId],
    queryFn: () => getCashFlowSummary(producerId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  const summary = data || {
    totalReceivable: 0,
    totalPayable: 0,
    confirmedReceivable: 0,
    confirmedPayable: 0,
    pendingReceivable: 0,
    pendingPayable: 0,
    balance: 0,
  };

  const cards = [
    { title: "Saldo Líquido", value: formatBRL(summary.balance), icon: Wallet, color: summary.balance >= 0 ? "text-green-600" : "text-red-600" },
    { title: "Total a Receber", value: formatBRL(summary.totalReceivable), icon: TrendingUp, color: "text-green-600", sub: `${formatBRL(summary.pendingReceivable)} pendente` },
    { title: "Total a Pagar", value: formatBRL(summary.totalPayable), icon: TrendingDown, color: "text-red-600", sub: `${formatBRL(summary.pendingPayable)} pendente` },
    { title: "Confirmado", value: formatBRL(summary.confirmedReceivable - summary.confirmedPayable), icon: Clock, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <card.icon className="h-4 w-4" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Receitas confirmadas</span>
              <span className="text-sm font-medium text-green-600">{formatBRL(summary.confirmedReceivable)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Receitas pendentes</span>
              <span className="text-sm font-medium text-muted-foreground">{formatBRL(summary.pendingReceivable)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Despesas confirmadas</span>
              <span className="text-sm font-medium text-red-600">-{formatBRL(summary.confirmedPayable)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Despesas pendentes</span>
              <span className="text-sm font-medium text-muted-foreground">-{formatBRL(summary.pendingPayable)}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold">
              <span>Saldo projetado</span>
              <span className={summary.balance >= 0 ? "text-green-600" : "text-red-600"}>{formatBRL(summary.balance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
