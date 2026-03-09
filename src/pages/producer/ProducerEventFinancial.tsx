import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Clock, XCircle, Wallet, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, orderCSVColumns } from "@/lib/csv-export";
import { useState } from "react";

export default function ProducerEventFinancial() {
  const { id } = useParams();
  const [txFilter, setTxFilter] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["event-financial-orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, subtotal, discount_amount, platform_fee, net_amount, payment_method, status, payment_status, coupon_id, created_at, profiles:buyer_id(full_name)")
        .eq("event_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const paid = orders?.filter((o) => o.status === "paid") || [];
  const pending = orders?.filter((o) => o.status === "pending") || [];
  const cancelled = orders?.filter((o) => o.status === "cancelled" || o.status === "refunded") || [];

  const totalSold = paid.reduce((s, o) => s + (o.total || 0), 0);
  const totalPending = pending.reduce((s, o) => s + (o.total || 0), 0);
  const totalCancelled = cancelled.reduce((s, o) => s + (o.total || 0), 0);
  const totalFees = paid.reduce((s, o) => s + (o.platform_fee || 0), 0);
  const totalPayout = totalSold - totalFees;

  const filteredOrders = orders?.filter((o) => {
    if (txFilter === "paid") return o.status === "paid";
    if (txFilter === "pending") return o.status === "pending";
    if (txFilter === "cancelled") return o.status === "cancelled" || o.status === "refunded";
    return true;
  }) || [];

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Aprovado", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      refunded: { label: "Estornado", variant: "outline" },
      expired: { label: "Expirado", variant: "outline" },
    };
    const m = map[s] || { label: s, variant: "secondary" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Vendas Totais</p>
                  <p className="text-xl font-display font-bold">{fmt(totalSold)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Em Processamento</p>
                  <p className="text-xl font-display font-bold">{fmt(totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Canceladas</p>
                  <p className="text-xl font-display font-bold">{fmt(totalCancelled)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Repasse</p>
                  <p className="text-xl font-display font-bold">{fmt(totalPayout)}</p>
                  <p className="text-xs text-muted-foreground">Taxa: {fmt(totalFees)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">Histórico das Transações</CardTitle>
          <div className="flex gap-2">
            <Select value={txFilter} onValueChange={setTxFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="paid">Aprovadas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => filteredOrders.length && exportToCSV(filteredOrders as any, orderCSVColumns, `financeiro_${id}`)} disabled={!filteredOrders.length}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma transação encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                     <th className="p-3 font-medium">Nº Pedido</th>
                     <th className="p-3 font-medium">Comprador</th>
                     <th className="p-3 font-medium">Data</th>
                     <th className="p-3 font-medium">Subtotal</th>
                     <th className="p-3 font-medium">Desconto</th>
                     <th className="p-3 font-medium">Valor</th>
                     <th className="p-3 font-medium">Taxa</th>
                     <th className="p-3 font-medium">Líquido</th>
                     <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                       <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                       <td className="p-3">{order.profiles?.full_name || "—"}</td>
                       <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                       <td className="p-3">{fmt(order.subtotal || 0)}</td>
                       <td className="p-3 text-muted-foreground">{order.discount_amount > 0 ? `-${fmt(order.discount_amount)}` : "—"}</td>
                       <td className="p-3">{fmt(order.total || 0)}</td>
                       <td className="p-3 text-muted-foreground">{fmt(order.platform_fee || 0)}</td>
                       <td className="p-3 font-medium">{fmt((order.total || 0) - (order.platform_fee || 0))}</td>
                       <td className="p-3">{statusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                   <tr className="border-t border-border font-medium">
                     <td colSpan={3} className="p-3 text-right text-muted-foreground">Total</td>
                     <td className="p-3">{fmt(filteredOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0))}</td>
                     <td className="p-3 text-muted-foreground">{fmt(filteredOrders.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0))}</td>
                     <td className="p-3">{fmt(filteredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0))}</td>
                     <td className="p-3 text-muted-foreground">{fmt(filteredOrders.reduce((s: number, o: any) => s + (o.platform_fee || 0), 0))}</td>
                     <td className="p-3">{fmt(filteredOrders.reduce((s: number, o: any) => s + ((o.total || 0) - (o.platform_fee || 0)), 0))}</td>
                     <td className="p-3"></td>
                   </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
