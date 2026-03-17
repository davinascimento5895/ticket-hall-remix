import { useParams } from "react-router-dom";
import { Search, RotateCcw, Download, FileText } from "lucide-react";
import { exportToCSV, orderCSVColumns } from "@/lib/csv-export";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { RefundDialog } from "@/components/RefundDialog";
import { getEventOrdersPaginated } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";

export default function ProducerEventOrders() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refundOrder, setRefundOrder] = useState<any>(null);

  const {
    items: orders,
    totalCount,
    page,
    totalPages,
    setPage,
    resetPage,
    isLoading,
    isFetching,
  } = usePaginatedQuery({
    queryKey: ["event-orders", id, statusFilter, search],
    queryFn: (range) =>
      getEventOrdersPaginated(
        id!,
        { status: statusFilter, search },
        range
      ),
    pageSize: 20,
    enabled: !!id,
  });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [statusFilter, search, resetPage]);

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pago" },
    { value: "pending", label: "Pendente" },
    { value: "cancelled", label: "Cancelado" },
    { value: "refunded", label: "Estornado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => orders.length && exportToCSV(orders, orderCSVColumns, `pedidos_${id}`)} disabled={!orders.length}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput placeholder="Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
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
          ) : orders.length === 0 ? (
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
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                      <td className="p-3">{order.profiles?.full_name || "—"}</td>
                      <td className="p-3">{formatBRL(order.total)}</td>
                      <td className="p-3 text-muted-foreground">{order.payment_method || "—"}</td>
                      <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 flex gap-1">
                        {order.status === "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("generate-invoice", { body: { order_id: order.id } });
                                if (error) throw error;
                                const w = window.open("", "_blank");
                                if (w) { w.document.write(data.html); w.document.close(); }
                                toast({ title: `Nota ${data.invoice_number} gerada!` });
                              } catch (e: any) {
                                toast({ title: "Erro ao gerar nota", description: e.message, variant: "destructive" });
                              }
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> Nota
                          </Button>
                        )}
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 pt-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({totalCount} registros)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Próximo
                </Button>
              </div>
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
