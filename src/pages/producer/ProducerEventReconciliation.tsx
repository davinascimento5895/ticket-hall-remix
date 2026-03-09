import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getEventReconciliation } from "@/lib/api-financial";
import { format } from "date-fns";

const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

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
    { key: "grossRevenue", header: "Receita Bruta", render: (row) => <span className="font-semibold">{fmt(row.grossRevenue)}</span> },
    { key: "platformFees", header: "Taxa Plataforma", render: (row) => <span className="text-muted-foreground">{fmt(row.platformFees)}</span> },
    { key: "gatewayFees", header: "Gateway", render: (row) => <span className="text-muted-foreground">{fmt(row.gatewayFees)}</span> },
    { key: "refunds", header: "Reembolsos", render: (row) => <span className="text-red-600">{fmt(row.refunds)}</span> },
    { key: "netRevenue", header: "Líquido", render: (row) => <span className={`font-bold ${row.netRevenue >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(row.netRevenue)}</span> },
  ];

  const totalNet = events.reduce((s: number, e: any) => s + (e.netRevenue || 0), 0);
  const totalGross = events.reduce((s: number, e: any) => s + (e.grossRevenue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Receita bruta total: <strong className="text-foreground">{fmt(totalGross)}</strong></span>
        <span>Líquido total: <strong className="text-green-600">{fmt(totalNet)}</strong></span>
        <span>{events.length} evento(s)</span>
      </div>

      <DataTable columns={columns} data={events} isLoading={isLoading} emptyMessage="Nenhum evento encontrado." />
    </div>
  );
}
