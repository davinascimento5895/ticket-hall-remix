import { useState } from "react";
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
import { ArrowLeft, Camera, Lock } from "lucide-react";
import { toast } from "sonner";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { format } from "date-fns";

const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function EditarPerfil() {
  const { user, profile, signOut, refetchRole } = useAuth();
  const navigate = useNavigate();

  const nameParts = (profile?.full_name || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [birthDate, setBirthDate] = useState((profile as any)?.birth_date || "");
  const [city, setCity] = useState((profile as any)?.city || "");
  const [state, setState] = useState((profile as any)?.state || "");
  const [preferredCategories, setPreferredCategories] = useState<string[]>(
    (profile as any)?.preferred_categories || []
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleSave = async () => {
    if (!user) return;
    if (!firstName.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    setSaving(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        birth_date: birthDate || null,
        city: city.trim() || null,
        state: state || null,
        preferred_categories: preferredCategories.length > 0 ? preferredCategories : null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      await refetchRole();
      toast.success("Perfil atualizado!");
      navigate("/meu-perfil");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    await signOut();
    toast.success("Sua conta foi desativada. Entre em contato com o suporte para exclusão definitiva.");
    navigate("/");
  };

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
              <button
                className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background active:scale-95 transition-transform"
                aria-label="Alterar foto"
                onClick={() => toast.info("Em breve: upload de foto de perfil")}
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs text-muted-foreground uppercase tracking-wider">Nome</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Seu nome" className="bg-muted/50 border-0 focus-visible:ring-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs text-muted-foreground uppercase tracking-wider">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Seu sobrenome" className="bg-muted/50 border-0 focus-visible:ring-1" />
            </div>
          </div>

          <Separator />

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-xs text-muted-foreground uppercase tracking-wider">Data de nascimento</Label>
            <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="bg-muted/50 border-0 focus-visible:ring-1" />
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Localização</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs text-muted-foreground">Cidade</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sua cidade" className="bg-muted/50 border-0 focus-visible:ring-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs text-muted-foreground">Estado</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="bg-muted/50 border-0 focus:ring-1">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Preferred Categories */}
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Categorias preferidas</h3>
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

          {/* Email (read-only) */}
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">E-mail</h3>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="flex-1 text-sm text-muted-foreground truncate">{email}</span>
              <Lock className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por segurança.</p>
          </div>

          <Separator />

          {/* Linked Accounts */}
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contas vinculadas</h3>
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
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full py-3 text-center text-destructive font-medium text-sm hover:underline active:opacity-70">
                Excluir conta
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                <AlertDialogDescription>Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
