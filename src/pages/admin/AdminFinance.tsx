import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, CreditCard, Percent, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getFinanceData } from "@/lib/api-admin";

export default function AdminFinance() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance"],
    queryFn: getFinanceData,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const methodLabels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    boleto: "Boleto",
    outro: "Outro",
  };

  const metrics = [
    { label: "GMV Total", value: data ? fmt(data.totalGMV) : "—", icon: DollarSign },
    { label: "Receita Plataforma", value: data ? fmt(data.totalPlatformFee) : "—", icon: TrendingUp },
    { label: "Taxas de Gateway", value: data ? fmt(data.totalGatewayFee) : "—", icon: CreditCard },
    { label: "Receita Líquida", value: data ? fmt(data.netRevenue) : "—", icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Financeiro</h1>
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
              {isLoading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-display font-bold">{m.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Receita por Método de Pagamento</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data?.byMethod && Object.keys(data.byMethod).length > 0 ? (
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
                      <td className="p-3">{fmt(info.total)}</td>
                      <td className="p-3 text-muted-foreground">{data.totalGMV > 0 ? ((info.total / data.totalGMV) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados financeiros.</p>
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
