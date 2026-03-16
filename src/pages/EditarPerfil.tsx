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
import { ArrowLeft, Camera, Lock, Loader2 } from "lucide-react";
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

  const inputClass = "bg-muted/50 border-0 focus-visible:ring-1";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider";
  const sectionTitleClass = "text-xs text-muted-foreground uppercase tracking-wider font-medium";

  return (
    <>
      <SEOHead title="Editar Perfil | TicketHall" description="Edite seu perfil no TicketHall" />

      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-2 -ml-1 active:scale-95" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">Editar Perfil</h1>
          <div className="w-8" />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-3 pt-8 pb-4 max-w-lg mx-auto px-4">
          <button onClick={() => navigate("/meu-perfil")} className="p-2 -ml-2 hover:bg-muted rounded-lg" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground font-[var(--font-display)]">Editar Perfil</h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-4 space-y-8">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                  e.target.value = "";
                }}
              />
              <button
                className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background active:scale-95 transition-transform"
                aria-label="Alterar foto"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* ── Dados pessoais ── */}
          <div className="space-y-4">
            <h3 className={sectionTitleClass}>Dados pessoais</h3>
            <div className="space-y-2">
              <Label htmlFor="fullName" className={labelClass}>Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className={labelClass}>CPF</Label>
                <Input id="cpf" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate" className={labelClass}>Data de nascimento</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={labelClass}>Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className={inputClass} />
            </div>
          </div>

          <Separator />

          {/* ── Endereço ── */}
          <div className="space-y-4">
            <h3 className={sectionTitleClass}>Endereço</h3>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="cep" className={labelClass}>CEP</Label>
              <div className="relative">
                <Input id="cep" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} className={inputClass} />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="street" className={labelClass}>Endereço</Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua / Avenida" className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressNumber" className={labelClass}>Número</Label>
                <Input id="addressNumber" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="123" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complement" className={labelClass}>Complemento</Label>
                <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className={labelClass}>Bairro</Label>
                <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className={labelClass}>Cidade</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sua cidade" className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className={labelClass}>Estado</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="bg-muted/50 border-0 focus:ring-1">
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

          <Separator />

          {/* ── E-mail (read-only) ── */}
          <div className="space-y-3">
            <h3 className={sectionTitleClass}>E-mail</h3>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="flex-1 text-sm text-muted-foreground truncate">{email}</span>
              <Lock className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por segurança.</p>
          </div>

          <Separator />

          {/* ── Categorias preferidas ── */}
          <div className="space-y-3">
            <h3 className={sectionTitleClass}>Categorias preferidas</h3>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    preferredCategories.includes(cat.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Contas vinculadas ── */}
          <div className="space-y-3">
            <h3 className={sectionTitleClass}>Contas vinculadas</h3>
            <div className="space-y-2">
              {linkedAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="flex-1 text-sm text-foreground">{account.label}</span>
                  <Badge variant={account.linked ? "default" : "secondary"} className="text-[10px]">
                    {account.linked ? "Vinculada" : "Não vinculada"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar alterações"}
          </Button>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full py-3 text-center text-destructive font-medium text-sm hover:underline active:opacity-70">
                Excluir conta permanentemente
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir sua conta? Todos os seus dados, ingressos e histórico serão removidos permanentemente. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Excluindo..." : "Excluir minha conta"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
