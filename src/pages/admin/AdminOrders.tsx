import { Download, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToCSV, orderCSVColumns } from "@/lib/csv-export";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllOrdersPaginated } from "@/lib/api-admin";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatBRL } from "@/lib/utils";

const methodLabels: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto",
  free: "Gratuito",
};

function OrderDetail({ order }: { order: any }) {
  const net = (order.total || 0) - (order.platform_fee || 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">ID do Pedido</p>
          <p className="font-mono text-xs">{order.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Status</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Comprador</p>
          <p className="font-medium">{order.profiles?.full_name || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Evento</p>
          <p className="font-medium">{order.events?.title || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Método de Pagamento</p>
          <p>{methodLabels[order.payment_method] || order.payment_method || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">Data</p>
          <p>{new Date(order.created_at).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatBRL(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa Plataforma</span>
            <span className="font-medium">{formatBRL(order.platform_fee)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-medium">Valor Líquido</span>
            <span className="font-bold">{formatBRL(net)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const {
    items: orders,
    totalCount,
    page,
    totalPages,
    pageSize,
    setPage,
    resetPage,
    isLoading,
  } = usePaginatedQuery({
    queryKey: ["admin-orders", statusFilter, debouncedSearch],
    queryFn: (range) => getAllOrdersPaginated({ status: statusFilter, search: debouncedSearch || undefined }, range),
    pageSize: 20,
    staleTime: 30_000,
  });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [statusFilter, debouncedSearch, resetPage]);

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pago" },
    { value: "pending", label: "Pendente" },
    { value: "cancelled", label: "Cancelado" },
    { value: "refunded", label: "Estornado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Todos os Pedidos</h1>
        <Button variant="outline" size="sm" onClick={() => orders.length && exportToCSV(orders, orderCSVColumns, "pedidos")} disabled={!orders.length}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID do pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3.5 py-1.5 text-sm rounded-full transition-colors font-medium ${
                statusFilter === s.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">ID</th>
                    <th className="p-3 font-medium">Comprador</th>
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Taxa</th>
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                      <td className="p-3">{order.profiles?.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground max-w-[150px] truncate">{order.events?.title || "—"}</td>
                      <td className="p-3 font-medium">{formatBRL(order.total)}</td>
                      <td className="p-3 text-muted-foreground">{formatBRL(order.platform_fee)}</td>
                      <td className="p-3 text-muted-foreground">{methodLabels[order.payment_method] || order.payment_method || "—"}</td>
                      <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Pedido #{order.id.slice(0, 8)}</DialogTitle>
                            </DialogHeader>
                            <OrderDetail order={order} />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} pedido(s) · Página {page} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
