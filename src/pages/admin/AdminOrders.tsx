import { Download, Eye, ChevronLeft, ChevronRight, ArrowDownUp, ShoppingCart } from "lucide-react";
import { exportToCSV, orderCSVColumns } from "@/lib/csv-export";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllOrdersPaginated, getAllEvents } from "@/lib/api-admin";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatBRL } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EventPicker } from "@/components/admin/EventPicker";
import { EventImage } from "@/components/EventImage";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

const methodLabels: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  boleto: "Boleto",
  free: "Gratuito",
};

const sortOptions = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "highest_total", label: "Maior valor" },
  { value: "lowest_total", label: "Menor valor" },
] as const;

function OrderDetail({ order }: { order: any }) {
  const net = (order.total || 0) - (order.platform_fee || 0);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
        <div className="relative aspect-[16/9] overflow-hidden">
          <EventImage
            src={order.events?.cover_image_url}
            alt={order.events?.title || "Evento"}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-4 top-4">
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/80 px-4 py-3 text-white">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Evento</p>
            <p className="font-display text-xl font-bold leading-tight">{order.events?.title || "—"}</p>
            <p className="text-sm text-white/80">{order.events?.venue_city || "Sem cidade"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">ID do Pedido</p>
          <p className="font-mono text-xs">{order.id}</p>
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Status</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Comprador</p>
          <p className="font-medium">{order.profiles?.full_name || "—"}</p>
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Evento</p>
          <p className="font-medium">{order.events?.title || "—"}</p>
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Método de Pagamento</p>
          <p>{methodLabels[order.payment_method] || order.payment_method || "—"}</p>
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Data</p>
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
  const [eventId, setEventId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("recent");
  const debouncedSearch = useDebounce(search, 400);

  const { data: events = [] } = useQuery({
    queryKey: ["admin-order-events"],
    queryFn: () => getAllEvents({ status: "all" }),
    staleTime: 5 * 60_000,
  });

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
    queryKey: ["admin-orders", statusFilter, debouncedSearch, eventId, sortBy],
    queryFn: (range) =>
      getAllOrdersPaginated(
        { status: statusFilter, search: debouncedSearch || undefined, eventId: eventId || undefined, sortBy },
        range,
      ),
    pageSize: 20,
    staleTime: 30_000,
  });

  useEffect(() => {
    resetPage();
  }, [statusFilter, debouncedSearch, eventId, sortBy, resetPage]);

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pago" },
    { value: "pending", label: "Pendente" },
    { value: "cancelled", label: "Cancelado" },
    { value: "refunded", label: "Estornado" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Fluxo de caixa"
        title="Pedidos"
        description="A lista pode ser filtrada por evento, status e ordem. Cada linha abre o detalhe do pedido com o contexto visual do evento.">
        <Button
          variant="outline"
          size="sm"
          onClick={() => orders.length && exportToCSV(orders, orderCSVColumns, "pedidos")}
          disabled={!orders.length}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </AdminPageHeader>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl flex-1">
              <SearchInput placeholder="Buscar por ID do pedido..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(1,minmax(220px,320px))]">
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    statusFilter === s.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <EventPicker
              value={eventId}
              onValueChange={setEventId}
              events={events}
              placeholder="Filtrar por evento"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhum pedido encontrado"
              description="Ajuste o status, o evento ou a busca para localizar a operação desejada."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Pedido</th>
                    <th className="p-3 font-medium">Comprador</th>
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Taxa</th>
                    <th className="p-3 font-medium">Método</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{order.profiles?.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.payment_method ? methodLabels[order.payment_method] || order.payment_method : "—"}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 overflow-hidden rounded-xl border border-border/70 bg-muted">
                            <EventImage src={order.events?.cover_image_url} alt={order.events?.title || "Evento"} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{order.events?.title || "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.events?.venue_city || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{formatBRL(order.total)}</td>
                      <td className="p-3 text-muted-foreground">{formatBRL(order.platform_fee)}</td>
                      <td className="p-3 text-muted-foreground">{methodLabels[order.payment_method] || order.payment_method || "—"}</td>
                      <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1.5">
                              <Eye className="h-4 w-4" />
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

      {totalCount > pageSize && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {totalCount} pedido(s) · Página {page} de {totalPages}
          </span>
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