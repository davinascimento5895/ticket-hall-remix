import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhooksManager } from "@/components/producer/WebhooksManager";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { getBankAccounts, createBankAccount, deleteBankAccount } from "@/lib/api-financial";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload, Loader2, Camera, ImageIcon, ShieldCheck, Activity, Wallet, Link2, ArrowUpRight } from "lucide-react";

export default function ProducerSettings() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    documento: (profile as any)?.cnpj || profile?.cpf || "",
  });

  const [bankForm, setBankForm] = useState({
    account_name: "",
    pix_key: "",
    bank_name: "",
    agency: "",
    account_number: "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "organizer" | "bank" | "integrations">("profile");

  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts", user?.id],
    queryFn: () => getBankAccounts(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const digits = form.documento.replace(/\D/g, "");
      const isCNPJ = digits.length > 11;
      return updateProfile(user!.id, {
        full_name: form.full_name,
        phone: form.phone,
        cpf: isCNPJ ? null : form.documento || null,
        cnpj: isCNPJ ? form.documento : null,
      } as any);
    },
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

  // Image upload handler
  const handleImageUpload = async (
    file: File,
    field: "avatar_url" | "organizer_logo_url" | "organizer_banner_url",
    setLoading: (v: boolean) => void,
  ) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter até 5MB", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Use JPG, PNG ou WebP", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${field}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      await updateProfile(user.id, { [field]: data.publicUrl } as any);
      toast({ title: "Imagem atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const initialDocumento = (profile as any)?.cnpj || profile?.cpf || "";
  const hasProfileChanges =
    form.full_name !== (profile?.full_name || "")
    || form.phone !== (profile?.phone || "")
    || form.documento !== initialDocumento;

  const documentDigits = form.documento.replace(/\D/g, "");
  const profileHealthScore = [
    form.full_name.trim().length > 0,
    form.phone.trim().length > 0,
    documentDigits.length >= 11,
    bankAccounts.length > 0,
  ].filter(Boolean).length * 25;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações do Produtor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie identidade, recebimentos e integrações com um fluxo operacional unificado.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="organizer">Página Pública</TabsTrigger>
          <TabsTrigger value="bank">Bancário</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="pt-4 space-y-4">
          {/* Avatar */}
          <Card className="border-border/70">
            <CardHeader><CardTitle className="text-base">Foto de Perfil</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {profile?.full_name?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div>
                  <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "avatar_url", setUploadingAvatar); e.target.value = ""; }} />
                  <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                    Alterar foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · até 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card className="border-border/70">
            <CardHeader><CardTitle className="text-base">Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
              <div><Label>CPF / CNPJ</Label><Input value={form.documento} onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))} placeholder="000.000.000-00 ou 00.000.000/0000-00" /></div>
              <p className="text-xs text-muted-foreground">
                Esses dados aparecem em comunicações oficiais e ajudam na validação da conta para saques.
              </p>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="organizer" className="pt-4 space-y-4">
          {/* Logo + Banner uploads */}
          <Card className="border-border/70">
            <CardHeader><CardTitle className="text-base">Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <Label className="text-sm font-medium">Logo do organizador</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {profile?.organizer_logo_url ? (
                      <img src={profile.organizer_logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "organizer_logo_url", setUploadingLogo); e.target.value = ""; }} />
                    <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                      {uploadingLogo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                      {profile?.organizer_logo_url ? "Alterar logo" : "Enviar logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 200x200px</p>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <Label className="text-sm font-medium">Banner / Capa</Label>
                <div className="mt-2 w-full aspect-[3/1] max-h-[160px] rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-dashed border-border">
                  {profile?.organizer_banner_url ? (
                    <img src={profile.organizer_banner_url} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1" />
                      <span className="text-xs">Sem banner</span>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "organizer_banner_url", setUploadingBanner); e.target.value = ""; }} />
                  <Button variant="outline" size="sm" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}>
                    {uploadingBanner ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {profile?.organizer_banner_url ? "Alterar banner" : "Enviar banner"}
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">Recomendado: 1920x640px</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text fields */}
          <Card className="border-border/70">
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

          <TabsContent value="bank" className="pt-4 space-y-4">
          {/* Existing accounts */}
          {bankAccounts.map((acc: any) => (
            <Card key={acc.id} className="border-border/70">
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
          <Card className="border-border/70">
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

          <TabsContent value="integrations" className="pt-4">
          <WebhooksManager />
          </TabsContent>

          {activeTab === "profile" && (
            <div className="sticky bottom-3 z-10 mt-4 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {hasProfileChanges ? "Alterações pendentes no perfil." : "Perfil sincronizado com sucesso."}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!hasProfileChanges || saveMutation.isPending}
                    onClick={() => setForm({
                      full_name: profile?.full_name || "",
                      phone: profile?.phone || "",
                      documento: (profile as any)?.cnpj || profile?.cpf || "",
                    })}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !hasProfileChanges}>
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar alterações
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Tabs>

        <div className="space-y-3">
          <Card className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Saúde da conta</p>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{profileHealthScore}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Prontidão operacional para receber e gerenciar eventos.</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${profileHealthScore}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Wallet className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Prontidão de saque</p>
                  <p className="text-xs text-muted-foreground">
                    {bankAccounts.length > 0 ? "Conta bancária cadastrada e pronta para repasses." : "Cadastre uma conta bancária para habilitar recebimentos."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Status da operação</p>
                  <p className="text-xs text-muted-foreground">Perfil e identidade refletidos na pagina publica do organizador.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Integrações</p>
                  <p className="text-xs text-muted-foreground">Gerencie webhooks e automacoes para CRM e billing.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ações rápidas</p>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setActiveTab("bank")}
              >
                Revisar dados bancários
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setActiveTab("integrations")}
              >
                Configurar webhooks
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
