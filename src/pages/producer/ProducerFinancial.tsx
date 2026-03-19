import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import ProducerAccountsPayable from "./ProducerAccountsPayable";
import ProducerAccountsReceivable from "./ProducerAccountsReceivable";
import ProducerCashFlow from "./ProducerCashFlow";
import ProducerBankAccounts from "./ProducerBankAccounts";
import ProducerEventReconciliation from "./ProducerEventReconciliation";
import { ArrowUpRight, CalendarDays, Download, Landmark, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import { getBankAccounts, getCashFlowSummary } from "@/lib/api-financial";
import { formatBRL } from "@/lib/utils";

export default function ProducerFinancial() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"cashflow" | "receivable" | "payable" | "reconciliation" | "bank">("cashflow");
  const [periodLabel, setPeriodLabel] = useState<"30d" | "month" | "quarter">("month");

  if (!user) return null;

  const periodText = useMemo(() => {
    if (periodLabel === "30d") return "Últimos 30 dias";
    if (periodLabel === "quarter") return "Último trimestre";
    return "Este mês";
  }, [periodLabel]);

  const { data: cashFlowData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["cash-flow", user.id],
    queryFn: () => getCashFlowSummary(user.id),
    staleTime: 30_000,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts", user.id],
    queryFn: () => getBankAccounts(user.id),
    staleTime: 30_000,
  });

  const summary = useMemo(() => {
    const items = cashFlowData?.items || [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const filteredItems = items.filter((item: any) => {
      if (!item.due_date) return true;
      const dueDate = new Date(item.due_date);

      if (periodLabel === "30d") return dueDate >= thirtyDaysAgo;
      if (periodLabel === "quarter") return dueDate >= ninetyDaysAgo;
      return dueDate >= startOfMonth;
    });

    const receivable = filteredItems.filter((i: any) => i.type === "receivable");
    const payable = filteredItems.filter((i: any) => i.type === "payable");

    const totalReceivable = receivable.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const totalPayable = payable.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const confirmedReceivable = receivable
      .filter((i: any) => i.status === "confirmed" || i.status === "paid")
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const pendingReceivable = receivable
      .filter((i: any) => i.status === "pending")
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const pendingPayable = payable
      .filter((i: any) => i.status === "pending")
      .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

    return {
      totalReceivable,
      totalPayable,
      confirmedReceivable,
      pendingReceivable,
      pendingPayable,
      balance: totalReceivable - totalPayable,
    };
  }, [cashFlowData?.items, periodLabel]);

  const settlementRate = summary.totalReceivable > 0
    ? (summary.confirmedReceivable / summary.totalReceivable) * 100
    : 0;

  const financialHealthScore = useMemo(() => {
    let points = 0;
    if (bankAccounts.length > 0) points += 40;
    if (summary.totalReceivable > 0 || summary.totalPayable > 0) points += 30;
    if (summary.pendingPayable <= summary.pendingReceivable) points += 30;
    return points;
  }, [bankAccounts.length, summary.totalPayable, summary.totalReceivable, summary.pendingPayable, summary.pendingReceivable]);

  const payoutStatus = bankAccounts.length > 0
    ? "Conta bancária configurada para repasses"
    : "Cadastre uma conta bancária para habilitar repasses";

  const kpiCards = [
    { label: "Saldo em caixa", value: isLoadingSummary ? "..." : formatBRL(summary.balance), hint: "Saldo líquido real do período", icon: WalletCards },
    { label: "Previsão de recebimento", value: isLoadingSummary ? "..." : formatBRL(summary.pendingReceivable), hint: "Entradas pendentes no período", icon: TrendingUp },
    { label: "Compromissos do período", value: isLoadingSummary ? "..." : formatBRL(summary.pendingPayable), hint: "Pagamentos pendentes no período", icon: Landmark },
    { label: "Taxa de liquidação", value: isLoadingSummary ? "..." : `${settlementRate.toFixed(1)}%`, hint: "% recebido sobre o total a receber", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Central executiva para fluxo de caixa, recebíveis, pagamentos e conciliação operacional.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
              <Button size="sm" variant={periodLabel === "month" ? "default" : "ghost"} onClick={() => setPeriodLabel("month")}>Este mês</Button>
              <Button size="sm" variant={periodLabel === "30d" ? "default" : "ghost"} onClick={() => setPeriodLabel("30d")}>30 dias</Button>
              <Button size="sm" variant={periodLabel === "quarter" ? "default" : "ghost"} onClick={() => setPeriodLabel("quarter")}>Trimestre</Button>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border/70 bg-card/90">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
            <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="reconciliation">Conferência</TabsTrigger>
            <TabsTrigger value="bank">Contas Bancárias</TabsTrigger>
          </TabsList>

          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between">
              <Badge variant="outline" className="text-[11px]">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                Período: {periodText}
              </Badge>
            </div>

            <TabsContent value="cashflow" className="m-0">
              <ProducerCashFlow producerId={user.id} />
            </TabsContent>
            <TabsContent value="receivable" className="m-0">
              <ProducerAccountsReceivable producerId={user.id} />
            </TabsContent>
            <TabsContent value="payable" className="m-0">
              <ProducerAccountsPayable producerId={user.id} />
            </TabsContent>
            <TabsContent value="reconciliation" className="m-0">
              <ProducerEventReconciliation producerId={user.id} />
            </TabsContent>
            <TabsContent value="bank" className="m-0">
              <ProducerBankAccounts producerId={user.id} />
            </TabsContent>
          </div>
        </Tabs>

        <div className="space-y-3">
          <Card className="border-border/70">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Saúde financeira</p>
              <p className="mt-2 text-sm font-medium text-foreground">{financialHealthScore >= 70 ? "Operação equilibrada" : "Requer atenção"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{payoutStatus}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${financialHealthScore}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ações rápidas</p>
              <Button variant="outline" className="w-full justify-between" onClick={() => setActiveTab("bank")}>
                Gerenciar contas bancárias
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => setActiveTab("reconciliation")}>
                Revisar conciliação
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => setActiveTab("receivable")}>
                Ver recebíveis
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
