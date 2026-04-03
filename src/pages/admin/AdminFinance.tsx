import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, CreditCard, Percent, Download, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getFinanceData, getAllEvents } from "@/lib/api-admin";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatBRL } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventPicker } from "@/components/admin/EventPicker";
import { Badge } from "@/components/ui/badge";

const presets = [
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Este mês", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Este ano", getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Todo o período", days: 0 },
];

export default function AdminFinance() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activePreset, setActivePreset] = useState("Todo o período");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const queryDateRange = useMemo(() => {
    const hasRange = Boolean(dateRange.from || dateRange.to || selectedEventId);
    if (!hasRange) return undefined;

    return {
      from: dateRange.from ? dateRange.from.toISOString() : undefined,
      to: dateRange.to ? dateRange.to.toISOString() : undefined,
      eventId: selectedEventId || undefined,
    };
  }, [dateRange, selectedEventId]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance", queryDateRange],
    queryFn: () => getFinanceData(queryDateRange),
    staleTime: 60_000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-finance-events"],
    queryFn: () => getAllEvents({ status: "all" }),
    staleTime: 5 * 60_000,
  });

  const selectedEvent = events.find((event: any) => event.id === selectedEventId);

  const handlePreset = (preset: typeof presets[number]) => {
    setActivePreset(preset.label);
    if (preset.days === 0) {
      setDateRange({ from: undefined, to: undefined });
    } else if (preset.getRange) {
      const range = preset.getRange();
      setDateRange({ from: range.from, to: range.to });
    } else {
      setDateRange({ from: subDays(new Date(), preset.days), to: new Date() });
    }
  };

  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    boleto: "Boleto",
    free: "Gratuito",
    outro: "Outro",
  };

  const metrics = [
    { label: "GMV Total", value: data ? formatBRL(data.totalGMV) : "—", icon: DollarSign },
    { label: "Receita Plataforma", value: data ? formatBRL(data.totalPlatformFee) : "—", icon: TrendingUp },
    { label: "Taxas de Gateway", value: data ? formatBRL(data.totalGatewayFee) : "—", icon: CreditCard },
    { label: "Receita Líquida", value: data ? formatBRL(data.netRevenue) : "—", icon: Percent },
  ];

  const byMethodEntries = useMemo(() => {
    if (!data?.byMethod) return [];
    return Object.entries(data.byMethod).sort((a, b) => b[1].total - a[1].total);
  }, [data?.byMethod]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Financeiro"
        title="Caixa da plataforma"
        description="A visão financeira acompanha o mesmo contexto de evento e período do dashboard, evitando números soltos e tornando as conferências mais confiáveis."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">Contexto: {selectedEvent?.title || "Todos os eventos"}</Badge>
          <Badge className="border-border/70 bg-background/70 text-muted-foreground">Período: {activePreset || "Personalizado"}</Badge>
        </div>
      </AdminPageHeader>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    activePreset === p.label
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateRange.from
                      ? `${format(dateRange.from, "dd/MM/yy")} — ${dateRange.to ? format(dateRange.to, "dd/MM/yy") : "hoje"}`
                      : "Personalizado"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      setActivePreset("");
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <EventPicker
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              events={events}
              placeholder="Filtrar por evento"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-display font-bold", isLoading && "animate-pulse text-muted-foreground")}>
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Receita por método de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {byMethodEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Pedidos</th>
                    <th className="p-3 font-medium">Volume</th>
                    <th className="p-3 font-medium">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byMethodEntries.map(([method, info]) => (
                    <tr key={method} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                      <td className="p-3 font-medium">{methodLabels[method] || method}</td>
                      <td className="p-3 text-muted-foreground">{info.count}</td>
                      <td className="p-3">{formatBRL(info.total)}</td>
                      <td className="p-3 text-muted-foreground">{data && data.totalGMV > 0 ? ((info.total / data.totalGMV) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : "Sem dados financeiros para o período selecionado."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Repasses pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            O acompanhamento de repasses será detalhado por evento nesta mesma tela assim que a liquidação por evento estiver exposta no backend.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!data?.byMethod) return;
            const rows = Object.entries(data.byMethod).map(([method, info]: any) => ({
              method: methodLabels[method] || method,
              count: info.count,
              total: info.total,
            }));
            import("@/lib/csv-export").then(({ exportToCSV }) => {
              exportToCSV(
                rows,
                [
                  { key: "method", header: "Método" },
                  { key: "count", header: "Pedidos" },
                  { key: "total", header: "Volume", format: (v: number) => v?.toFixed(2) },
                ],
                "financeiro",
              );
            });
          }}
          disabled={!data?.byMethod}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}