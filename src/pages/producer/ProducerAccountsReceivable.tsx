import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getFinancialTransactions, createFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";
import { resolveFinancialCategoryLabel, useFinancialCategories } from "@/hooks/useFinancialCategories";

const statusColors: Record<string, string> = {
  pending: "secondary",
  confirmed: "default",
  paid: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  paid: "Recebido",
  cancelled: "Cancelado",
};

export default function ProducerAccountsReceivable({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { categories, addCategory, removeCategory } = useFinancialCategories(producerId, "receivable");
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "ticket_sale",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!categories.some((category) => category.value === form.category)) {
      setForm((previous) => ({ ...previous, category: categories[0]?.value || "ticket_sale" }));
    }
  }, [categories, form.category]);

  const categoryOptionsForCreate = useMemo(() => {
    if (categories.some((category) => category.value === form.category)) return categories;
    return [...categories, { value: form.category, label: resolveFinancialCategoryLabel(form.category, categories) }];
  }, [categories, form.category]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["financial-receivable", producerId, statusFilter],
    queryFn: () => getFinancialTransactions(producerId, {
      type: "receivable",
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: () => createFinancialTransaction({
      producer_id: producerId,
      type: "receivable",
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      setShowCreate(false);
      setForm({ description: "", amount: "", category: "ticket_sale", due_date: "", notes: "" });
      toast({ title: "Conta a receber criada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => updateFinancialTransaction(id, { status: "paid", paid_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      toast({ title: "Recebimento confirmado!" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      toast({ title: "Removido!" });
    },
  });

  const columns: DataTableColumn<any>[] = [
    { key: "description", header: "Descrição", render: (row) => <span className="font-medium">{row.description}</span> },
    { key: "category", header: "Categoria", render: (row) => <span className="text-sm">{resolveFinancialCategoryLabel(row.category, categories)}</span> },
    { key: "amount", header: "Valor", render: (row) => <span className="font-semibold text-green-600">{formatBRL(row.amount)}</span> },
    { key: "due_date", header: "Vencimento", render: (row) => row.due_date ? format(new Date(row.due_date), "dd/MM/yyyy") : "—" },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusColors[row.status] as any}>{statusLabels[row.status] || row.status}</Badge> },
    {
      key: "actions", header: "", render: (row) => (
        <div className="flex gap-1">
          {row.status === "pending" && (
            <Button size="icon" variant="ghost" onClick={() => confirmMut.mutate(row.id)} title="Confirmar recebimento">
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

  const handleAddCategory = async () => {
    const result = await addCategory(newCategoryLabel);
    if (!result.ok) {
      toast({ title: "Categoria invalida", description: result.reason, variant: "destructive" });
      return;
    }

    setNewCategoryLabel("");
    setForm((previous) => ({ ...previous, category: result.value }));
    toast({ title: "Categoria adicionada!" });
  };

  const handleRemoveCategory = async (value: string) => {
    const result = await removeCategory(value);
    if (!result.ok) {
      toast({ title: "Nao foi possivel remover", description: result.reason, variant: "destructive" });
      return;
    }

    if (form.category === value) {
      setForm((previous) => ({ ...previous, category: result.fallback || "ticket_sale" }));
    }

    toast({ title: "Categoria removida!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="paid">Recebido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Total: <strong className="text-green-600">{formatBRL(total)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCategoryManager(true)}>Categorias</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nova entrada</Button>
        </div>
      </div>

      <DataTable columns={columns} data={transactions} isLoading={isLoading} emptyMessage="Nenhuma conta a receber cadastrada." />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta a receber</DialogTitle>
            <DialogDescription>Registre uma receita esperada.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Venda de ingressos Lote 1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptionsForCreate.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
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

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorias de contas a receber</DialogTitle>
            <DialogDescription>Adicione ou remova categorias para usar nas receitas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Ex: Patrocinio, Bilheteria externa"
              />
              <Button onClick={handleAddCategory} disabled={!newCategoryLabel.trim()}>Adicionar</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((category) => (
                <div key={category.value} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">{category.label}</span>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRemoveCategory(category.value)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryManager(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
