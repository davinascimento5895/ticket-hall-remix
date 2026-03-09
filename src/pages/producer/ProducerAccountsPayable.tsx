import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getFinancialTransactions, createFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const fmt = (v: number) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const statusLabels: Record<string, string> = { pending: "Pendente", confirmed: "Confirmado", paid: "Pago", cancelled: "Cancelado" };
const statusVariants: Record<string, string> = { pending: "secondary", confirmed: "default", paid: "default", cancelled: "destructive" };

export default function ProducerAccountsPayable({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ description: "", amount: "", category: "commission", due_date: "", notes: "" });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["financial-payable", producerId, statusFilter],
    queryFn: () => getFinancialTransactions(producerId, {
      type: "payable",
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
  });

  const createMut = useMutation({
    mutationFn: () => createFinancialTransaction({
      producer_id: producerId,
      type: "payable",
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-payable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      setShowCreate(false);
      setForm({ description: "", amount: "", category: "commission", due_date: "", notes: "" });
      toast({ title: "Conta a pagar criada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => updateFinancialTransaction(id, { status: "paid", paid_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-payable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      toast({ title: "Pagamento confirmado!" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-payable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      toast({ title: "Removido!" });
    },
  });

  const columns: DataTableColumn<any>[] = [
    { key: "description", header: "Descrição", render: (row) => <span className="font-medium">{row.description}</span> },
    { key: "category", header: "Categoria", render: (row) => <span className="text-sm capitalize">{row.category?.replace("_", " ")}</span> },
    { key: "amount", header: "Valor", render: (row) => <span className="font-semibold text-red-600">{fmt(row.amount)}</span> },
    { key: "due_date", header: "Vencimento", render: (row) => row.due_date ? format(new Date(row.due_date), "dd/MM/yyyy") : "—" },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status] as any}>{statusLabels[row.status] || row.status}</Badge> },
    {
      key: "actions", header: "", render: (row) => (
        <div className="flex gap-1">
          {row.status === "pending" && (
            <Button size="icon" variant="ghost" onClick={() => confirmMut.mutate(row.id)} title="Confirmar pagamento">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(row.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const total = transactions.reduce((s: number, t: any) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Total: <strong className="text-red-600">{fmt(total)}</strong></span>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nova despesa</Button>
      </div>

      <DataTable columns={columns} data={transactions} isLoading={isLoading} emptyMessage="Nenhuma conta a pagar cadastrada." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta a pagar</DialogTitle>
            <DialogDescription>Registre uma despesa ou comissão a pagar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Comissão promoter João" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commission">Comissão</SelectItem>
                    <SelectItem value="refund">Reembolso</SelectItem>
                    <SelectItem value="platform_fee">Taxa plataforma</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Data de vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
            <div><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.description || !form.amount || createMut.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
