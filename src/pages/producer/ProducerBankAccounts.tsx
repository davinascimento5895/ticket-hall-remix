import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Star, Building2 } from "lucide-react";
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";

export default function ProducerBankAccounts({ producerId }: { producerId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    account_name: "",
    bank_name: "",
    agency: "",
    account_number: "",
    pix_key: "",
    pix_key_type: "cpf",
    is_default: false,
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts", producerId],
    queryFn: () => getBankAccounts(producerId),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: () => createBankAccount({ producer_id: producerId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setShowCreate(false);
      setForm({ account_name: "", bank_name: "", agency: "", account_number: "", pix_key: "", pix_key_type: "cpf", is_default: false });
      toast({ title: "Conta adicionada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const setDefaultMut = useMutation({
    mutationFn: async (id: string) => {
      // Unset all
      for (const acc of accounts) {
        if (acc.is_default) await updateBankAccount(acc.id, { is_default: false });
      }
      await updateBankAccount(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Conta padrão atualizada!" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Conta removida!" });
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">Suas contas bancárias</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nova conta</Button>
      </div>

      {accounts.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhuma conta bancária cadastrada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc: any) => (
            <Card key={acc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{acc.account_name}</p>
                      {acc.is_default && <Badge variant="default" className="text-xs">Padrão</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {acc.bank_name && <p>Banco: {acc.bank_name}</p>}
                      {acc.agency && <p>Agência: {acc.agency} | Conta: {acc.account_number}</p>}
                      {acc.pix_key && <p>PIX ({acc.pix_key_type}): {acc.pix_key}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!acc.is_default && (
                      <Button size="icon" variant="ghost" onClick={() => setDefaultMut.mutate(acc.id)} title="Definir como padrão">
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(acc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta bancária</DialogTitle>
            <DialogDescription>Adicione uma conta para recebimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome da conta</Label><Input value={form.account_name} onChange={(e) => setForm(p => ({ ...p, account_name: e.target.value }))} placeholder="Ex: Conta PJ Itaú" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Banco</Label><Input value={form.bank_name} onChange={(e) => setForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="Itaú" /></div>
              <div><Label>Agência</Label><Input value={form.agency} onChange={(e) => setForm(p => ({ ...p, agency: e.target.value }))} /></div>
            </div>
            <div><Label>Número da conta</Label><Input value={form.account_number} onChange={(e) => setForm(p => ({ ...p, account_number: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo PIX</Label>
                <Select value={form.pix_key_type} onValueChange={(v) => setForm(p => ({ ...p, pix_key_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF/CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Chave PIX</Label><Input value={form.pix_key} onChange={(e) => setForm(p => ({ ...p, pix_key: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.account_name || createMut.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
