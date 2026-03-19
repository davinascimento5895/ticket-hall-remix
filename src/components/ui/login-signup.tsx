"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Chrome, Eye, EyeOff, Lock, Mail, X } from "lucide-react";

export type LoginSignupModalView = "login" | "register";

export interface LoginSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: LoginSignupModalView;
  onSubmit?: (
    data: { email: string; password: string; name?: string },
    view: LoginSignupModalView
  ) => void;
  onViewChange?: (view: LoginSignupModalView) => void;
  onSocialLogin?: (provider: "google") => void;
}

export default function LoginSignupModal({
  open,
  onOpenChange,
  defaultView = "login",
  onSubmit,
  onViewChange,
  onSocialLogin,
}: LoginSignupModalProps) {
  const [view, setView] = React.useState<LoginSignupModalView>(defaultView);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);
  const [isUltraCompact, setIsUltraCompact] = React.useState(false);

  React.useEffect(() => {
    const updateViewportMode = () => {
      const viewportHeight = window.innerHeight;
      setIsCompact(viewportHeight <= 820);
      setIsUltraCompact(viewportHeight <= 700);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("ticket-hall-remember-email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setView(defaultView);
      setShowPassword(false);
    }
  }, [defaultView, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.(
      {
        email,
        password,
        name: view === "register" ? name : undefined,
      },
      view,
    );

    if (remember) {
      localStorage.setItem("ticket-hall-remember-email", email);
    } else {
      localStorage.removeItem("ticket-hall-remember-email");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Card
            className={`relative overflow-hidden border border-border/60 shadow-xl w-full max-w-[420px] h-auto max-h-[calc(100dvh-1rem)] ${
              isUltraCompact ? "max-w-[360px]" : isCompact ? "max-w-[390px]" : ""
            }`}
          >
            <div className="flex h-full flex-col overflow-hidden">
            <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-black/10 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
            <CardHeader className={`space-y-2 ${isUltraCompact ? "p-4 pb-2" : isCompact ? "p-5 pb-3" : ""}`}>
              <CardTitle className={isUltraCompact ? "text-lg" : isCompact ? "text-xl" : "text-2xl"}>
                {view === "login" ? "Entrar" : "Criar conta"}
              </CardTitle>
              <CardDescription className="text-zinc-500">
                {view === "login"
                  ? "Acesse sua conta para comprar, acompanhar pedidos e muito mais."
                  : "Crie sua conta para começar a explorar eventos e ofertas."}
              </CardDescription>

              <div className="flex items-center justify-center gap-2">
                <div
                  className={`h-1.5 rounded-full transition-[width] ${
                    view === "login" ? "w-10 bg-primary" : "w-4 bg-muted"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-[width] ${
                    view === "register" ? "w-10 bg-primary" : "w-4 bg-muted"
                  }`}
                />
              </div>
            </CardHeader>

<form
                onSubmit={handleSubmit}
              className={`grid ${
                isUltraCompact ? "gap-3 p-4 pt-1" : isCompact ? "gap-4 p-5 pt-2" : "gap-5"
              }`}
            >
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    onViewChange?.("login");
                  }}
                  className={`flex-1 ${isUltraCompact ? "pb-2 text-xs" : "pb-3 text-sm"} font-medium transition-colors border-b-2 ${
                    view === "login"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("register");
                    onViewChange?.("register");
                  }}
                  className={`flex-1 ${isUltraCompact ? "pb-2 text-xs" : "pb-3 text-sm"} font-medium transition-colors border-b-2 ${
                    view === "register"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {view === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="signup-name" className="text-zinc-500">
                    Nome
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Seu nome"
                      className={`${isUltraCompact ? "h-9 text-sm" : "h-10"} bg-surface border-border`}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="login-email" className="text-zinc-500">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@email.com.br"
                    className={`${isUltraCompact ? "h-9 text-sm" : "h-10"} pl-10 bg-surface border-border`}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="login-password" className="text-zinc-500">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className={`${isUltraCompact ? "h-9 text-sm" : "h-10"} pl-10 pr-10 bg-surface border-border`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {view === "login" && (
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      checked={remember}
                      onCheckedChange={(checked) => setRemember(!!checked)}
                    />
                    <span className="select-none">Lembrar meu e-mail</span>
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                    onClick={() => {
                      /* placeholder: abrir fluxo de recuperação de senha */
                    }}
                  >
                    Esqueci a senha
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full gap-2 ${isUltraCompact ? "h-10 text-sm" : "h-11"}`}
                onClick={handleSubmit}
              >
                <ArrowRight className="h-4 w-4" />
                {view === "login" ? "Entrar" : "Criar conta e continuar"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => onSocialLogin?.("google")}
                className={`w-full border-border ${isUltraCompact ? "h-10 text-sm" : "h-11"}`}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </Button>
              </form>

            <CardFooter
              className={`justify-center gap-1 text-zinc-500 ${
                isUltraCompact ? "text-xs p-4 pt-2" : isCompact ? "text-sm p-5 pt-3" : "text-sm"
              }`}
            >
              {view === "login" ? (
                <>
                  Não tem conta?
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setView("register")}
                  >
                    Criar agora
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setView("login")}
                  >
                    Entrar
                  </button>
                </>
              )}
            </CardFooter>
          </div>
          </Card>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
