import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AlterarSenha() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSave = async () => {
    if (!currentPassword) {
      toast({ title: "Informe a senha atual", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });
    if (signInError) {
      setSaving(false);
      toast({ title: "Senha atual incorreta", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao alterar senha: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      navigate("/meu-perfil");
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Erro ao enviar e-mail de redefinição", variant: "destructive" });
    } else {
      toast({ title: "Enviamos um link de redefinição para " + user.email });
    }
  };

  return (
    <>
      <SEOHead title="Alterar Senha | TicketHall" description="Altere sua senha" />

      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Alterar senha
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="currentPassword" className="text-xs text-muted-foreground uppercase tracking-wider">
                Senha atual
              </Label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {sendingReset ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              className="bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs text-muted-foreground uppercase tracking-wider">
              Nova senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-muted/50 border-0 focus-visible:ring-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground uppercase tracking-wider">
              Confirmar nova senha
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Alterar senha"}
          </Button>
        </div>
      </div>
    </>
  );
}
