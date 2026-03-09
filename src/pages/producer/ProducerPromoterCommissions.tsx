import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getPromoterCommissions, updateCommissionStatus, batchUpdateCommissionStatus } from "@/lib/api-promoters";
import { getPromoters } from "@/lib/api-promoters";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, DollarSign } from "lucide-react";

const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovada", paid: "Paga", cancelled: "Cancelada" };
const statusVariants: Record<string, string> = { pending: "secondary", approved: "default", paid: "default", cancelled: "destructive" };

export default function ProducerPromoterCommissions({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [promoterFilter, setPromoterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: promoters = [] } = useQuery({
    queryKey: ["promoters", producerId],
    queryFn: () => getPromoters(producerId),
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["promoter-commissions", producerId, promoterFilter, statusFilter],
    queryFn: () => getPromoterCommissions(producerId, {
      promoter_id: promoterFilter === "all" ? undefined : promoterFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateCommissionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-commissions"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const batchMut = useMutation({
    mutationFn: (status: string) => batchUpdateCommissionStatus(Array.from(selected), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoter-commissions"] });
      setSelected(new Set());
      toast({ title: "Comissões atualizadas!" });
    },
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === commissions.length) setSelected(new Set());
    else setSelected(new Set(commissions.map((c: any) => c.id)));
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "select", header: "",
      render: (row) => <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} />,
      className: "w-8",
    },
    { key: "promoter", header: "Promoter", render: (row) => <span className="font-medium">{row.promoters?.name || "—"}</span> },
    { key: "event", header: "Evento", render: (row) => <span className="text-sm">{row.events?.title || "—"}</span> },
    { key: "order_amount", header: "Valor Pedido", render: (row) => fmt(row.order_amount) },
    { key: "commission_amount", header: "Comissão", render: (row) => <span className="font-semibold">{fmt(row.commission_amount)}</span> },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status] as any}>{statusLabels[row.status] || row.status}</Badge> },
    { key: "created_at", header: "Data", render: (row) => row.created_at ? format(new Date(row.created_at), "dd/MM/yyyy") : "—" },
    {
      key: "actions", header: "",
      render: (row) => (
        <div className="flex gap-1">
          {row.status === "pending" && (
            <Button size="icon" variant="ghost" onClick={() => updateMut.mutate({ id: row.id, status: "approved" })} title="Aprovar">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {row.status === "approved" && (
            <Button size="icon" variant="ghost" onClick={() => updateMut.mutate({ id: row.id, status: "paid" })} title="Marcar como pago">
              <DollarSign className="h-4 w-4 text-green-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalCommission = commissions.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
  const pendingCount = commissions.filter((c: any) => c.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={promoterFilter} onValueChange={setPromoterFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar promoter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos promoters</SelectItem>
              {promoters.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Total: <strong>{fmt(totalCommission)}</strong> · {pendingCount} pendente(s)
          </span>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => batchMut.mutate("approved")}>Aprovar ({selected.size})</Button>
            <Button size="sm" onClick={() => batchMut.mutate("paid")}>Pagar ({selected.size})</Button>
          </div>
        )}
      </div>

      <DataTable columns={columns} data={commissions} isLoading={isLoading} emptyMessage="Nenhuma comissão registrada." />
    </div>
  );
}
