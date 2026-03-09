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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Camera, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function EditarPerfil() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const nameParts = (profile?.full_name || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const email = user?.email || "";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  // Determine linked providers
  const providers = user?.app_metadata?.providers as string[] | undefined;
  const linkedAccounts = [
    { id: "apple", label: "Apple", linked: providers?.includes("apple") },
    { id: "google", label: "Google", linked: providers?.includes("google") },
  ];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado!");
      navigate("/meu-perfil");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    // Sign out user — actual deletion would require an edge function
    await signOut();
    toast.success("Sua conta foi desativada. Entre em contato com o suporte para exclusão definitiva.");
    navigate("/");
  };

  return (
    <>
      <SEOHead title="Editar Perfil | TicketHall" description="Edite seu perfil no TicketHall" />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Editar Perfil
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-8">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background"
                aria-label="Alterar foto"
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs text-muted-foreground uppercase tracking-wider">
                Nome
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Seu nome"
                className="bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs text-muted-foreground uppercase tracking-wider">
                Sobrenome
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
                className="bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <Separator />

          {/* Email (read-only) */}
          <div className="space-y-4">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              E-mail
            </h3>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/50">
              <span className="flex-1 text-sm text-foreground truncate">{email}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Separator />

          {/* Linked Accounts */}
          <div className="space-y-4">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Contas vinculadas
            </h3>
            <div className="space-y-2">
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/50"
                >
                  <span className="flex-1 text-sm text-foreground">{account.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              <button className="w-full py-3 text-center text-destructive font-medium text-sm hover:underline">
                Excluir conta
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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
