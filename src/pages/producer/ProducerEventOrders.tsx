import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { RefundDialog } from "@/components/RefundDialog";
import { getEventOrders } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function ProducerEventOrders() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refundOrder, setRefundOrder] = useState<any>(null);

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: async () => { const { data } = await supabase.from("events").select("title").eq("id", id).single(); return data; },
    enabled: !!id,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["event-orders", id],
    queryFn: () => getEventOrders(id!),
    enabled: !!id,
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const filtered = orders?.filter((o: any) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.profiles?.full_name?.toLowerCase().includes(s) || o.id.includes(s);
    }
    return true;
  }) || [];

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pago" },
    { value: "pending", label: "Pendente" },
    { value: "cancelled", label: "Cancelado" },
    { value: "refunded", label: "Estornado" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/producer/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-2xl font-bold">Pedidos — {event?.title || "..."}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statusFilter === s.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">ID</th>
                    <th className="p-3 font-medium">Comprador</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                      <td className="p-3">{order.profiles?.full_name || "—"}</td>
                      <td className="p-3">{fmt(order.total)}</td>
                      <td className="p-3 text-muted-foreground">{order.payment_method || "—"}</td>
                      <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">
                        {(order.status === "paid" || order.status === "processing") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRefundOrder(order)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reembolsar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <RefundDialog
        open={!!refundOrder}
        onOpenChange={(open) => !open && setRefundOrder(null)}
        order={refundOrder}
      />
    </div>
  );
}
