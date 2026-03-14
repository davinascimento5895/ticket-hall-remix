import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, CreditCard, Percent, Download, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getFinanceData } from "@/lib/api-admin";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatBRL } from "@/lib/utils";

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

  const queryDateRange = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: dateRange.from.toISOString(),
      to: dateRange.to ? dateRange.to.toISOString() : new Date().toISOString(),
    };
  }, [dateRange]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance", queryDateRange],
    queryFn: () => getFinanceData(queryDateRange),
    staleTime: 60_000,
  });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Financeiro</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full transition-colors font-medium",
                activePreset === p.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateRange.from
                  ? `${format(dateRange.from, "dd/MM/yy")} — ${dateRange.to ? format(dateRange.to, "dd/MM/yy") : "hoje"}`
                  : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
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
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => {
          if (!data?.byMethod) return;
          const rows = Object.entries(data.byMethod).map(([method, info]: any) => ({ method: methodLabels[method] || method, count: info.count, total: info.total }));
          import("@/lib/csv-export").then(({ exportToCSV }) => {
            exportToCSV(rows, [{ key: "method", header: "Método" }, { key: "count", header: "Pedidos" }, { key: "total", header: "Volume", format: (v: number) => v?.toFixed(2) }], "financeiro");
          });
        }} disabled={!data?.byMethod}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-display font-bold", isLoading && "animate-pulse text-muted-foreground")}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Receita por Método de Pagamento</CardTitle></CardHeader>
        <CardContent>
          {data?.byMethod && Object.keys(data.byMethod).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Pedidos</th>
                    <th className="p-3 font-medium">Volume</th>
                    <th className="p-3 font-medium">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.byMethod).map(([method, info]) => (
                    <tr key={method} className="border-b border-border/50">
                      <td className="p-3 font-medium">{methodLabels[method] || method}</td>
                      <td className="p-3 text-muted-foreground">{info.count}</td>
                      <td className="p-3">{formatBRL(info.total)}</td>
                      <td className="p-3 text-muted-foreground">{data.totalGMV > 0 ? ((info.total / data.totalGMV) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isLoading ? "Carregando..." : "Sem dados financeiros para o período selecionado."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Repasses Pendentes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">🚧 Em breve — O repasse automático para produtores será disponibilizado após a integração com o gateway de pagamento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
