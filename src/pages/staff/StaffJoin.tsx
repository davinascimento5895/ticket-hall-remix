import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoWhite from "@/assets/logo-full-white.svg";
import logoBlack from "@/assets/logo-full-black.svg";

export default function StaffJoin() {
  const { code } = useParams<{ code: string }>();
  const { user, loading, refetchRole } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading");
  const [message, setMessage] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("auth_required");
      return;
    }
    joinEvent();
  }, [user, loading, code]);

  const joinEvent = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.rpc("join_event_as_staff", {
        p_access_code: code!,
      });
      if (error) throw error;
      const result = data as any;
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        await refetchRole();
        setStatus("success");
        setEventTitle(result.event_title);
        setMessage(result.already_member ? "Você já faz parte desta equipe!" : "Você foi adicionado à equipe!");
      }
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "Erro ao processar convite");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img src={logoBlack} alt="TicketHall" className="h-8 dark:hidden" />
        <img src={logoWhite} alt="TicketHall" className="h-8 hidden dark:block" />
      </div>

      <div className="w-full max-w-sm text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Processando convite...</p>
          </>
        )}

        {status === "auth_required" && (
          <>
            <p className="text-foreground font-medium">Faça login para entrar na equipe</p>
            <p className="text-sm text-muted-foreground">Você precisa estar logado para aceitar o convite de staff.</p>
            <Button onClick={() => setShowAuth(true)} className="w-full">Entrar / Cadastrar</Button>
            <AuthModal open={showAuth} onOpenChange={setShowAuth} />
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{message}</h2>
            {eventTitle && <p className="text-sm text-muted-foreground">Evento: {eventTitle}</p>}
            <Button onClick={() => navigate("/staff")} className="w-full mt-4">
              Ir para o Portal de Check-in
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Não foi possível entrar</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full mt-4">
              Voltar ao início
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
