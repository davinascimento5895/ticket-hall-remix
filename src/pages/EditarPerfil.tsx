import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Camera, Lock, Loader2, User, MapPin, Mail, Lock as LockIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { validateCPF, formatCPF, formatPhone } from "@/lib/validators";
import { fetchAddress, formatCEP } from "@/lib/cep";
import { useIBGEStates } from "@/hooks/useIBGELocations";

export default function EditarPerfil() {
  const { user, profile, signOut, refetchRole } = useAuth();
  const navigate = useNavigate();
  const { states } = useIBGEStates();

  // Personal data
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [cpf, setCpf] = useState(profile?.cpf ? formatCPF(profile.cpf) : "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "");
  const [phone, setPhone] = useState(profile?.phone ? formatPhone(profile.phone) : "");

  // Address
  const [cep, setCep] = useState(profile?.cep ? formatCEP(profile.cep) : "");
  const [street, setStreet] = useState(profile?.street || "");
  const [addressNumber, setAddressNumber] = useState(profile?.address_number || "");
  const [complement, setComplement] = useState(profile?.complement || "");
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");

  // Categories
  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    (profile as any)?.preferred_categories || []
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const email = user?.email || "";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const providers = user?.app_metadata?.providers as string[] | undefined;
  const linkedAccounts = [
    { id: "apple", label: "Apple", linked: providers?.includes("apple") },
    { id: "google", label: "Google", linked: providers?.includes("google") },
  ];

  const toggleCategory = (value: string) => {
    setPreferredCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  // CEP auto-fill
  const handleCepChange = useCallback(async (rawValue: string) => {
    const formatted = formatCEP(rawValue);
    setCep(formatted);

    const clean = rawValue.replace(/\D/g, "");
    if (clean.length === 8) {
      setLoadingCep(true);
      const address = await fetchAddress(clean);
      if (address) {
        setStreet(address.street || street);
        setNeighborhood(address.neighborhood || neighborhood);
        setCity(address.city || city);
        setState(address.state || state);
      }
      setLoadingCep(false);
    }
  }, [street, neighborhood, city, state]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter até 5MB", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Use JPG, PNG ou WebP", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-images").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      toast({ title: "Foto atualizada!" });
      await refetchRole();
    } catch (err: any) {
      toast({ title: err.message || "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!fullName.trim()) {
      toast({ title: "O nome é obrigatório", variant: "destructive" });
      return;
    }
    if (cpf.trim() && !validateCPF(cpf)) {
      toast({ title: "CPF inválido", description: "Verifique o CPF informado.", variant: "destructive" });
      return;
    }
    if (phone.trim() && phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Telefone inválido", description: "Preencha um número válido.", variant: "destructive" });
      return;
    }
    if (cep.trim() && cep.replace(/\D/g, "").length !== 8) {
      toast({ title: "CEP inválido", description: "Preencha um CEP válido com 8 dígitos.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCep = cep.replace(/\D/g, "");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        cpf: cleanCpf || null,
        birth_date: birthDate || null,
        phone: cleanPhone || null,
        cep: cleanCep || null,
        street: street.trim() || null,
        address_number: addressNumber.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state || null,
        preferred_categories: preferredCategories.length > 0 ? preferredCategories : null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      console.error("Save error:", error);
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    } else {
      await refetchRole();
      toast({ title: "Perfil atualizado!" });
      navigate("/meu-perfil");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: "destructive" });
        setDeleting(false);
        return;
      }
      await signOut();
      toast({ title: "Sua conta foi excluída com sucesso." });
      navigate("/");
    } catch (err: any) {
      toast({ title: err.message || "Erro ao excluir conta", variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <>
      <SEOHead title="Editar Perfil | TicketHall" description="Edite seu perfil no TicketHall" />

      <div className="min-h-screen bg-background">
        {/* ═── MOBILE LAYOUT ───═ */}
        <div className="md:hidden min-h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/meu-perfil")} className="p-2 -ml-1 active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold">Editar Perfil</h1>
            <div className="w-9" />
          </div>

          {/* Scroll Container */}
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="px-4 py-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-primary/10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-3xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
                  />
                  <button
                    className="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border-4 border-background active:scale-95"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dados Pessoais Card */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">Dados Pessoais</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">Nome completo</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">CPF</Label>
                      <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Nascimento</Label>
                      <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Endereço Card */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">Endereço</h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-xs font-medium">CEP</Label>
                    <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} className="mt-1" />
                    {loadingCep && <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Endereço</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua/Avenida" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Número</Label>
                      <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="123" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Complemento</Label>
                      <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto..." className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Bairro</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Cidade</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Estado</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* E-mail Card */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">E-mail</h3>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="flex-1 text-sm truncate">{email}</span>
                  <LockIcon className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Não pode ser alterado por segurança.</p>
              </div>

              {/* Categorias Card */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Categorias Preferidas</h3>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        preferredCategories.includes(cat.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contas Vinculadas Card */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Contas Vinculadas</h3>
                <div className="space-y-2">
                  {linkedAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <span className="text-sm">{acc.label}</span>
                      <Badge variant={acc.linked ? "default" : "secondary"} className="text-xs">
                        {acc.linked ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                    Excluir Conta Permanentemente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Todos os seus dados, ingressos e histórico serão apagados permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                      {deleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* ═── DESKTOP LAYOUT ───═ */}
        <div className="hidden md:flex h-screen">
          {/* Main Content (sidebar removed) */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8 space-y-8">
              {/* Avatar Section */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Perfil da Conta</h2>
                  <p className="text-muted-foreground">Gerenciar suas informações pessoais e de endereço</p>
                </div>
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-4xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
                  />
                  <button
                    className="absolute bottom-0 right-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground border-4 border-background hover:bg-primary/90"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              <Separator />

              {/* Dados Pessoais Section */}
              <div id="personal" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-medium">Nome Completo</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">CPF</Label>
                    <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Data de Nascimento</Label>
                    <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Endereço Section */}
              <div id="address" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-2 relative">
                    <Label className="font-medium">CEP</Label>
                    <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} />
                    {loadingCep && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="font-medium">Endereço (Rua/Avenida)</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Número</Label>
                    <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="123" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-medium">Complemento</Label>
                    <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Bairro</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-medium">Cidade</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Estado</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* E-mail Section */}
              <div id="email" className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Informações de Conta
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{email}</p>
                  </div>
                  <LockIcon className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">O e-mail não pode ser alterado por segurança.</p>
              </div>

              <Separator />

              {/* Categorias Section */}
              <div id="categories" className="space-y-4">
                <h3 className="text-lg font-semibold">Categorias Preferidas</h3>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        preferredCategories.includes(cat.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contas Vinculadas Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contas Vinculadas</h3>
                <div className="grid grid-cols-2 gap-4">
                  {linkedAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                      <span className="font-medium">{acc.label}</span>
                      <Badge variant={acc.linked ? "default" : "secondary"}>
                        {acc.linked ? "Vinculada" : "Não vinculada"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg" className="text-destructive hover:text-destructive">
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Conta Permanentemente</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível. Todos os seus dados, ingressos, pedidos e histórico serão apagados permanentemente do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                        {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavItem({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
