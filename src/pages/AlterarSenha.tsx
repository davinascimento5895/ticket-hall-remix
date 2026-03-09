import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AlterarSenha() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      navigate("/meu-perfil");
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
