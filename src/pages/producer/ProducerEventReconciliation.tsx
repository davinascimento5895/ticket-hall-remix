import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getEventReconciliation } from "@/lib/api-financial";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export default function ProducerEventReconciliation({ producerId }: { producerId: string }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["event-reconciliation", producerId],
    queryFn: () => getEventReconciliation(producerId),
    staleTime: 30_000,
  });

  const columns: DataTableColumn<any>[] = [
    {
      key: "title",
      header: "Evento",
      render: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-muted-foreground">{format(new Date(row.start_date), "dd/MM/yyyy")}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "published" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    { key: "ordersCount", header: "Pedidos", render: (row) => <span className="font-mono">{row.ordersCount}</span> },
    { key: "ticketsSold", header: "Ingressos", render: (row) => <span className="font-mono">{row.ticketsSold}</span> },
    { key: "ticketsCheckedIn", header: "Check-ins", render: (row) => <span className="font-mono">{row.ticketsCheckedIn}</span> },
    {
      key: "ticketRevenue",
      header: "Valor dos Ingressos",
      render: (row) => (
        <div>
          <span className="font-semibold">{formatBRL(row.ticketRevenue)}</span>
          <p className="text-[10px] text-muted-foreground">100% do produtor</p>
        </div>
      ),
    },
    {
      key: "platformFees",
      header: "Taxa Plataforma",
      render: (row) => (
        <div>
          <span className="text-muted-foreground">{formatBRL(row.platformFees)}</span>
          <p className="text-[10px] text-muted-foreground">pago pelo comprador</p>
        </div>
      ),
    },
    { key: "gatewayFees", header: "Gateway", render: (row) => <span className="text-muted-foreground">{formatBRL(row.gatewayFees)}</span> },
    { key: "refunds", header: "Reembolsos", render: (row) => <span className="text-red-600">{formatBRL(row.refunds)}</span> },
    {
      key: "netRevenue",
      header: "Líquido",
      render: (row) => <span className={`font-bold ${row.netRevenue >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(row.netRevenue)}</span>,
    },
  ];

  const totalNet = events.reduce((s: number, e: any) => s + (e.netRevenue || 0), 0);
  const totalTicketRevenue = events.reduce((s: number, e: any) => s + (e.ticketRevenue || 0), 0);
  const totalPlatformFees = events.reduce((s: number, e: any) => s + (e.platformFees || 0), 0);

  return (
    <div className="space-y-4">
      {/* Informational banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span className="text-muted-foreground">
          A taxa de plataforma é cobrada <strong className="text-foreground">diretamente do comprador</strong> no momento da compra.
          O produtor recebe <strong className="text-foreground">100% do valor dos ingressos</strong> que ele definiu.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>Valor dos ingressos: <strong className="text-foreground">{formatBRL(totalTicketRevenue)}</strong></span>
        <span>Taxa plataforma (comprador): <strong className="text-muted-foreground">{formatBRL(totalPlatformFees)}</strong></span>
        <span>Líquido: <strong className="text-green-600">{formatBRL(totalNet)}</strong></span>
        <span>{events.length} evento(s)</span>
      </div>

      <DataTable columns={columns} data={events} isLoading={isLoading} emptyMessage="Nenhum evento encontrado." />
    </div>
  );
}
