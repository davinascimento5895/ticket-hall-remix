import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle, Pencil } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { getFinancialTransactions, createFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";
import { resolveFinancialCategoryLabel, useFinancialCategories } from "@/hooks/useFinancialCategories";

const statusLabels: Record<string, string> = { pending: "Pendente", confirmed: "Confirmado", paid: "Pago", cancelled: "Cancelado" };
const statusVariants: Record<string, string> = { pending: "secondary", confirmed: "default", paid: "default", cancelled: "destructive" };

export default function ProducerAccountsPayable({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ description: "", amount: "", category: "commission", due_date: "", notes: "" });
  const [editId, setEditId] = useState<string>("");
  const [editForm, setEditForm] = useState({ description: "", amount: "", category: "commission", due_date: "", notes: "", status: "pending" });
  const { categories, addCategory, removeCategory } = useFinancialCategories(producerId, "payable");

  useEffect(() => {
    if (!categories.some((category) => category.value === form.category)) {
      setForm((previous) => ({ ...previous, category: categories[0]?.value || "commission" }));
    }
  }, [categories, form.category]);

  useEffect(() => {
    if (!categories.some((category) => category.value === editForm.category)) {
      setEditForm((previous) => ({ ...previous, category: categories[0]?.value || "commission" }));
    }
  }, [categories, editForm.category]);

  const categoryOptionsForCreate = useMemo(() => {
    if (categories.some((category) => category.value === form.category)) return categories;
    return [...categories, { value: form.category, label: resolveFinancialCategoryLabel(form.category, categories) }];
  }, [categories, form.category]);

  const categoryOptionsForEdit = useMemo(() => {
    if (categories.some((category) => category.value === editForm.category)) return categories;
    return [...categories, { value: editForm.category, label: resolveFinancialCategoryLabel(editForm.category, categories) }];
  }, [categories, editForm.category]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["financial-payable", producerId, statusFilter],
    queryFn: () => getFinancialTransactions(producerId, {
      type: "payable",
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    staleTime: 30_000,
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

  const editMut = useMutation({
    mutationFn: () => updateFinancialTransaction(editId, {
      description: editForm.description,
      amount: parseFloat(editForm.amount) || 0,
      category: editForm.category,
      due_date: editForm.due_date || null,
      notes: editForm.notes || null,
      status: editForm.status,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-payable"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
      setShowEdit(false);
      setEditId("");
      toast({ title: "Despesa atualizada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEditDialog = (row: any) => {
    setEditId(row.id);
    setEditForm({
      description: row.description || "",
      amount: String(row.amount ?? ""),
      category: row.category || "commission",
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : "",
      notes: row.notes || "",
      status: row.status || "pending",
    });
    setShowEdit(true);
  };

  const columns: DataTableColumn<any>[] = [
    { key: "description", header: "Descrição", render: (row) => <span className="font-medium">{row.description}</span> },
    { key: "category", header: "Categoria", render: (row) => <span className="text-sm">{resolveFinancialCategoryLabel(row.category, categories)}</span> },
    {
      key: "notes",
      header: "Observações",
      render: (row) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.notes || "—"}
        </span>
      ),
      className: "max-w-[220px]",
    },
    { key: "amount", header: "Valor", render: (row) => <span className="font-semibold text-red-600">{formatBRL(row.amount)}</span> },
    { key: "due_date", header: "Vencimento", render: (row) => row.due_date ? format(new Date(row.due_date), "dd/MM/yyyy") : "—" },
    { key: "status", header: "Status", render: (row) => <Badge variant={statusVariants[row.status] as any}>{statusLabels[row.status] || row.status}</Badge> },
    {
      key: "actions", header: "", render: (row) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => openEditDialog(row)} title="Editar despesa">
            <Pencil className="h-4 w-4" />
          </Button>
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

  const handleAddCategory = async () => {
    const result = await addCategory(newCategoryLabel);
    if (!result.ok) {
      toast({ title: "Categoria invalida", description: result.reason, variant: "destructive" });
      return;
    }

    setNewCategoryLabel("");
    setForm((previous) => ({ ...previous, category: result.value }));
    setEditForm((previous) => ({ ...previous, category: result.value }));
    toast({ title: "Categoria adicionada!" });
  };

  const handleRemoveCategory = async (value: string) => {
    const result = await removeCategory(value);
    if (!result.ok) {
      toast({ title: "Nao foi possivel remover", description: result.reason, variant: "destructive" });
      return;
    }

    const fallback = result.fallback || "commission";
    if (form.category === value) {
      setForm((previous) => ({ ...previous, category: fallback }));
    }
    if (editForm.category === value) {
      setEditForm((previous) => ({ ...previous, category: fallback }));
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
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Total: <strong className="text-red-600">{formatBRL(total)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCategoryManager(true)}>Categorias</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nova despesa</Button>
        </div>
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

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar despesa</DialogTitle>
            <DialogDescription>Atualize os dados da conta a pagar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição</Label><Input value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptionsForEdit.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data de vencimento</Label><Input type="date" value={editForm.due_date} onChange={(e) => setEditForm(p => ({ ...p, due_date: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button onClick={() => editMut.mutate()} disabled={!editForm.description || !editForm.amount || editMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorias de contas a pagar</DialogTitle>
            <DialogDescription>Adicione ou remova categorias para usar nas despesas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Ex: Fornecedor, Marketing, Estrutura"
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
