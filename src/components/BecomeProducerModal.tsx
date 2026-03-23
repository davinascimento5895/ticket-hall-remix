import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, validateCPF, formatPhone } from "@/lib/validators";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";

interface BecomeProducerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "auth" | "producer-data";

export function BecomeProducerModal({ open, onOpenChange }: BecomeProducerModalProps) {
  const { user, profile, role, refetchRole } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(user ? "producer-data" : "auth");
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isUltraCompact, setIsUltraCompact] = useState(false);

  // Auth fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Producer fields
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateViewportMode = () => {
      const viewportHeight = window.innerHeight;
      setIsCompact(viewportHeight <= 820);
      setIsUltraCompact(viewportHeight <= 640);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      if (user && role === "producer") {
        sessionStorage.removeItem("become_producer_flow");
        onOpenChange(false);
        navigate("/producer/events/new");
        return;
      }
      setStep(user ? "producer-data" : "auth");
      setCpf(profile?.cpf || "");
      setPhone(profile?.phone || "");
    } else {
      // Clean up session storage when modal closes
      sessionStorage.removeItem("become_producer_flow");
    }
  }, [open, user, role, navigate, onOpenChange, profile?.cpf, profile?.phone]);

  // Handle OAuth callback completing the flow
  useEffect(() => {
    if (open && user && step === "auth" && sessionStorage.getItem("become_producer_flow")) {
      setStep("producer-data");
      setCpf(profile?.cpf || "");
      setPhone(profile?.phone || "");
    }
  }, [user, open, step, profile]);

  // --- Auth handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      console.error("BecomeProducer login error:", error);
      toast({ title: "Erro ao entrar", variant: "destructive" });
    }
    // onAuthStateChange in AuthContext will update `user`, triggering auto-advance
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { full_name: regName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      console.error("BecomeProducer register error:", error);
      toast({ title: "Erro ao criar conta", variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    // Save state before OAuth flow (user will be redirected away)
    sessionStorage.setItem("become_producer_flow", "true");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("BecomeProducer google login error:", error);
      toast({ title: "Erro ao entrar", variant: "destructive" });
      sessionStorage.removeItem("become_producer_flow");
    }
  };

  // --- Producer handler ---
  const handleProducerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast({ title: "Telefone inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await supabase.functions.invoke("become-producer", {
        body: { cpf: cleanCpf, phone: cleanPhone },
      });
      if (result.error) throw result.error;
      const data = result.data as { alreadyProducer?: boolean } | null;
      if (data?.alreadyProducer) {
        toast({ title: "Você já é produtor!" });
      } else {
        toast({ title: "Conta de produtor ativada! Bem-vindo!" });
      }
      await refetchRole();
      onOpenChange(false);
      navigate("/producer/events/new");
    } catch {
      toast({ title: "Erro ao ativar conta de produtor", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepNumber = step === "auth" ? 1 : 2;
  const totalSteps = user ? 1 : 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card border-border p-0 overflow-hidden w-[min(92vw,420px)] max-w-[420px] max-h-[calc(100dvh-1rem)] ${
          isUltraCompact ? "w-[min(94vw,360px)] max-w-[360px]" : isCompact ? "w-[min(92vw,390px)] max-w-[390px]" : ""
        }`}
      >
        <div className={`${isUltraCompact ? "p-3 space-y-3" : isCompact ? "p-4 space-y-4" : "p-6 space-y-5"}`}>
          {/* Step indicator */}
          {totalSteps > 1 && !isUltraCompact && (
            <div className="flex items-center justify-center gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === stepNumber ? (isCompact ? "w-7 bg-primary" : "w-8 bg-primary") : "w-4 bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* ============ STEP 1: AUTH ============ */}
          {step === "auth" && (
            <>
              <div>
                <h2
                  className={`font-display font-bold text-foreground ${
                    isUltraCompact ? "text-lg" : isCompact ? "text-xl" : "text-2xl"
                  }`}
                >
                  {authTab === "login" ? "Entre na sua conta" : "Crie sua conta"}
                </h2>
                <p className={`${isUltraCompact ? "text-xs" : "text-sm"} text-muted-foreground mt-1`}>
                  Para criar eventos, você precisa de uma conta.
                </p>
              </div>

              {/* Tab toggle */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className={`flex-1 ${isUltraCompact ? "pb-2 text-xs" : "pb-3 text-sm"} font-medium transition-colors border-b-2 ${
                    authTab === "login"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  className={`flex-1 ${isUltraCompact ? "pb-2 text-xs" : "pb-3 text-sm"} font-medium transition-colors border-b-2 ${
                    authTab === "register"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {authTab === "login" ? (
                <form onSubmit={handleLogin} className={isUltraCompact ? "space-y-2" : isCompact ? "space-y-3" : "space-y-4"}>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>E-mail</Label>
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border`}
                    />
                  </div>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full gap-2 ${isUltraCompact ? "h-9 text-xs" : isCompact ? "h-10 text-sm" : ""}`}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {loading ? "Entrando..." : "Entrar e continuar"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className={isUltraCompact ? "space-y-2" : isCompact ? "space-y-3" : "space-y-4"}>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>Nome completo</Label>
                    <Input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border`}
                    />
                  </div>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>E-mail</Label>
                    <Input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border`}
                    />
                  </div>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                    <Label className={`text-muted-foreground ${isUltraCompact ? "text-[10px]" : "text-xs"} uppercase tracking-wider`}>Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        required
                        className={`${isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""} bg-secondary border-border pr-10`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className={`w-full gap-2 ${isUltraCompact ? "h-9 text-xs" : isCompact ? "h-10 text-sm" : ""}`}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {loading ? "Criando conta..." : "Criar conta e continuar"}
                  </Button>
                  <p className={`${isUltraCompact ? "text-[10px]" : "text-[11px]"} text-muted-foreground text-center`}>
                    Ao criar sua conta, você concorda com os{" "}
                    <Link to="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</Link>
                    {" "}e{" "}
                    <Link to="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                  </p>
                </form>
              )}

              {/* Separator + Google */}
              <div className={`relative ${isUltraCompact ? "my-1" : ""}`}>
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className={`w-full border-border ${isUltraCompact ? "h-9 text-xs" : isCompact ? "h-10 text-sm" : ""}`}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </Button>

              {/* Footer switch */}
              <p className={`text-center ${isUltraCompact ? "text-xs" : "text-sm"} text-muted-foreground`}>
                {authTab === "login" ? (
                  <>Não tem conta?{" "}<button type="button" onClick={() => setAuthTab("register")} className="text-primary font-medium hover:underline">Criar conta</button></>
                ) : (
                  <>Já tem conta?{" "}<button type="button" onClick={() => setAuthTab("login")} className="text-primary font-medium hover:underline">Entrar</button></>
                )}
              </p>
            </>
          )}

          {/* ============ STEP 2: PRODUCER DATA ============ */}
          {step === "producer-data" && (
            <>
              <div>
                <h2
                  className={`font-display font-bold text-foreground ${
                    isUltraCompact ? "text-lg" : isCompact ? "text-xl" : "text-2xl"
                  }`}
                >
                  Complete seus dados
                </h2>
                <p className={`${isUltraCompact ? "text-xs" : "text-sm"} text-muted-foreground mt-1`}>
                  Precisamos de algumas informações para ativar sua conta de produtor.
                </p>
              </div>

              <form onSubmit={handleProducerSubmit} className={isUltraCompact ? "space-y-2" : isCompact ? "space-y-3" : "space-y-4"}>
                <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                  <Label htmlFor="cpf" className={isUltraCompact ? "text-xs" : ""}>CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    required
                    className={isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""}
                  />
                </div>
                <div className={isUltraCompact ? "space-y-1" : "space-y-2"}>
                  <Label htmlFor="phone" className={isUltraCompact ? "text-xs" : ""}>Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    maxLength={15}
                    required
                    className={isUltraCompact ? "h-8 text-xs" : isCompact ? "h-9 text-sm" : ""}
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full ${isUltraCompact ? "h-9 text-xs" : isCompact ? "h-10 text-sm" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ativando conta...</>
                  ) : (
                    "Ativar e criar meu evento"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
