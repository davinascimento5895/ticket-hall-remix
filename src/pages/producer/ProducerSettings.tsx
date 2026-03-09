import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhooksManager } from "@/components/producer/WebhooksManager";
import { TeamMembersManager } from "@/components/producer/TeamMembersManager";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export default function ProducerSettings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    cpf: profile?.cpf || "",
  });

  const [bankForm, setBankForm] = useState({
    account_name: "",
    pix_key: "",
    bank_name: "",
    agency: "",
    account_number: "",
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts", user?.id],
    queryFn: () => getBankAccounts(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: () => updateProfile(user!.id, { full_name: form.full_name, phone: form.phone, cpf: form.cpf }),
    onSuccess: () => toast({ title: "Perfil atualizado!" }),
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const saveBankMutation = useMutation({
    mutationFn: () =>
      createBankAccount({
        producer_id: user!.id,
        account_name: bankForm.account_name || "Conta principal",
        pix_key: bankForm.pix_key || undefined,
        bank_name: bankForm.bank_name || undefined,
        agency: bankForm.agency || undefined,
        account_number: bankForm.account_number || undefined,
        is_default: bankAccounts.length === 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", user?.id] });
      setBankForm({ account_name: "", pix_key: "", bank_name: "", agency: "", account_number: "" });
      toast({ title: "Conta bancária adicionada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteBankMutation = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", user?.id] });
      toast({ title: "Conta removida." });
    },
  });

  // Debounced auto-save for organizer page fields
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedUpdate = useCallback((field: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateProfile(user!.id, { [field]: value } as any).then(() => {
        toast({ title: "Salvo!" });
      }).catch(() => {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      });
    }, 800);
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="organizer">Página Pública</TabsTrigger>
          <TabsTrigger value="bank">Bancário</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle className="text-base">Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
              <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizer" className="pt-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle className="text-base">Página do Organizador</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Personalize sua página pública em <strong>/organizador/{profile?.organizer_slug || "seu-slug"}</strong></p>
              <div><Label>Slug (URL)</Label><Input defaultValue={profile?.organizer_slug || ""} placeholder="minha-produtora" onBlur={(e) => debouncedUpdate("organizer_slug", e.target.value)} /></div>
              <div><Label>Bio</Label><Input defaultValue={profile?.organizer_bio || ""} placeholder="Sobre sua produtora..." onBlur={(e) => debouncedUpdate("organizer_bio", e.target.value)} /></div>
              <div><Label>Instagram</Label><Input defaultValue={profile?.organizer_instagram || ""} placeholder="https://instagram.com/..." onBlur={(e) => debouncedUpdate("organizer_instagram", e.target.value)} /></div>
              <div><Label>Facebook</Label><Input defaultValue={profile?.organizer_facebook || ""} placeholder="https://facebook.com/..." onBlur={(e) => debouncedUpdate("organizer_facebook", e.target.value)} /></div>
              <div><Label>Website</Label><Input defaultValue={profile?.organizer_website || ""} placeholder="https://..." onBlur={(e) => debouncedUpdate("organizer_website", e.target.value)} /></div>
              {profile?.organizer_slug && (
                <a href={`/organizador/${profile.organizer_slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  Ver página pública →
                </a>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="pt-4 max-w-2xl space-y-4">
          {/* Existing accounts */}
          {bankAccounts.map((acc: any) => (
            <Card key={acc.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{acc.account_name} {acc.is_default && <span className="text-xs text-primary">(padrão)</span>}</p>
                    {acc.pix_key && <p className="text-xs text-muted-foreground">PIX: {acc.pix_key}</p>}
                    {acc.bank_name && <p className="text-xs text-muted-foreground">{acc.bank_name} · Ag {acc.agency} · Cc {acc.account_number}</p>}
                  </div>
                  <button onClick={() => deleteBankMutation.mutate(acc.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new */}
          <Card>
            <CardHeader><CardTitle className="text-base">Adicionar Conta Bancária</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome da conta</Label><Input value={bankForm.account_name} onChange={(e) => setBankForm((p) => ({ ...p, account_name: e.target.value }))} placeholder="Ex: Conta PJ Itaú" /></div>
              <div><Label>Chave PIX</Label><Input value={bankForm.pix_key} onChange={(e) => setBankForm((p) => ({ ...p, pix_key: e.target.value }))} placeholder="CPF, e-mail ou telefone" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Banco</Label><Input value={bankForm.bank_name} onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))} /></div>
                <div><Label>Agência</Label><Input value={bankForm.agency} onChange={(e) => setBankForm((p) => ({ ...p, agency: e.target.value }))} /></div>
              </div>
              <div><Label>Conta</Label><Input value={bankForm.account_number} onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))} /></div>
              <Button onClick={() => saveBankMutation.mutate()} disabled={saveBankMutation.isPending || !bankForm.account_name}>
                Adicionar conta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="pt-4 max-w-2xl">
          <TeamMembersManager />
        </TabsContent>

        <TabsContent value="integrations" className="pt-4 max-w-2xl">
          <WebhooksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
