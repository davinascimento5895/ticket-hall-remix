import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import LoginSignupModal from "@/components/ui/login-signup";

function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos",
    "Email not confirmed": "E-mail ainda não foi confirmado. Verifique sua caixa de entrada.",
    "User already registered": "Este e-mail já está cadastrado",
    "Signup requires a valid password": "Informe uma senha válida",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "For security purposes, you can only request this after": "Por segurança, aguarde alguns segundos antes de tentar novamente.",
    "Unable to validate email address: invalid format": "Formato de e-mail inválido",
    "New password should be different from the old password": "A nova senha deve ser diferente da senha atual",
    "Auth session missing!": "Sessão expirada. Faça login novamente.",
  };

  for (const [key, value] of Object.entries(translations)) {
    if (message.includes(key)) return value;
  }

  return message;
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
  redirectTo?: string;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", redirectTo }: AuthModalProps) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setForgotMode(false);
    }
  }, [defaultTab, open]);

  const handleAuthSubmit = async (
    data: { email: string; password: string; name?: string },
    view: "login" | "register",
  ) => {
    if (!data.email || !data.password) return;

    setLoading(true);

    if (view === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      setLoading(false);
      if (error) {
        toast({ title: "Erro ao entrar", description: translateAuthError(error.message), variant: "destructive" });
        return;
      }
    } else {
      const response = await supabase.functions.invoke("signup-direct", {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.name,
        },
      });

      if (response.error) {
        setLoading(false);
        toast({ title: "Erro ao criar conta", description: translateAuthError(response.error.message), variant: "destructive" });
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      setLoading(false);
      if (signInError) {
        toast({ title: "Conta criada com sucesso!", description: "Conta criada sem confirmação de e-mail. Faça login com suas credenciais.", variant: "default" });
        return;
      }

      toast({ title: "Conta criada com sucesso!", description: "Você já está logado e não precisa confirmar o e-mail." });
    }

    onOpenChange(false);

    type RedirectState = { from?: { pathname?: string } };
    const from = redirectTo || (location.state as unknown as RedirectState)?.from?.pathname;
    if (from && from !== "/" && from !== location.pathname) {
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: translateAuthError(error.message), variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setForgotMode(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple" | "facebook") => {
    type RedirectState = { from?: { pathname?: string } };
    const dest = redirectTo || (location.state as unknown as RedirectState)?.from?.pathname;
    if (dest) {
      sessionStorage.setItem("auth_redirect_to", dest);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "Erro ao entrar", description: translateAuthError(error.message), variant: "destructive" });
    }
  };

  if (forgotMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-modal p-0 overflow-hidden">
          <div className="p-6 space-y-6">
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Redefinir senha</h2>
              <p className="text-sm text-muted-foreground mt-1">Enviaremos um link para redefinir sua senha.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">E-mail</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-secondary border-border-strong"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <LoginSignupModal
      open={open}
      onOpenChange={onOpenChange}
      defaultView={tab}
      loading={loading}
      onViewChange={(view) => setTab(view)}
      onSubmit={handleAuthSubmit}
      onSocialLogin={handleSocialLogin}
    />
  );
}
