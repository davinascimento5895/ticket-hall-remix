import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getEventForQueue, manageQueue } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";

export default function FilaVirtual() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { data: event, isLoading: loadingEvent, isError } = useQuery({
    queryKey: ["event-queue", slug],
    queryFn: () => getEventForQueue(slug!),
    enabled: !!slug,
  });

  const { data: queueStatus, refetch } = useQuery({
    queryKey: ["queue-status", event?.id, user?.id],
    queryFn: () => manageQueue("status", event!.id, user!.id),
    enabled: !!event?.id && !!user?.id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const handleJoinQueue = async () => {
    if (!user || !event) return;
    setJoining(true);
    try {
      const data = await manageQueue("join", event.id, user.id);
      if (data?.error) throw new Error(data.error);
      toast({ title: "Você entrou na fila!", description: `Posição: #${data.position}` });
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  // Redirect when admitted
  useEffect(() => {
    if (queueStatus?.status === "admitted") {
      toast({ title: "É sua vez!", description: "Redirecionando para o evento..." });
      const timer = setTimeout(() => navigate(`/eventos/${slug}`), 2500);
      return () => clearTimeout(timer);
    }
  }, [queueStatus?.status, navigate, slug]);

  const isAdmitted = queueStatus?.status === "admitted";
  const isWaiting = queueStatus?.status === "waiting";
  const inQueue = queueStatus?.inQueue;

  // Countdown for admission window
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!isAdmitted || !queueStatus?.expires_at) return;
    const interval = setInterval(() => {
      const diff = new Date(queueStatus.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        clearInterval(interval);
        refetch();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmitted, queueStatus?.expires_at]);

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container pt-4 lg:pt-24 pb-16 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Evento não encontrado</h1>
        <p className="text-muted-foreground mb-6">O evento que você procura não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <>
      <div className="container pt-4 lg:pt-24 pb-16 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          {event?.cover_image_url && (
            <img src={event.cover_image_url} alt={event?.title || "Evento"} className="w-full h-48 object-cover rounded-lg" />
          )}
          <h1 className="font-display text-2xl font-bold">{event?.title || "..."}</h1>
          <p className="text-muted-foreground">Fila Virtual</p>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6 space-y-6">
            {!inQueue ? (
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Este evento possui fila virtual. Entre na fila para garantir seu lugar na compra.
                </p>
                <Button onClick={handleJoinQueue} disabled={joining || !user} className="w-full gap-2">
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                  {joining ? "Entrando..." : "Entrar na fila"}
                </Button>
                {!user && (
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => setAuthOpen(true)} className="w-full">
                      Fazer login para entrar na fila
                    </Button>
                    <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
                  </div>
                )}
              </div>
            ) : isWaiting ? (
              <div className="text-center space-y-4">
                <Clock className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <div>
                  <p className="text-3xl font-display font-bold text-primary">#{queueStatus.position}</p>
                  <p className="text-sm text-muted-foreground">Sua posição na fila</p>
                </div>
                {queueStatus.peopleAhead > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {queueStatus.peopleAhead} {queueStatus.peopleAhead === 1 ? "pessoa" : "pessoas"} à sua frente
                  </p>
                )}
                <Progress value={queueStatus.peopleAhead != null ? Math.max(5, Math.round(100 / ((queueStatus.peopleAhead || 0) + 1))) : 5} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Aguarde, você será notificado quando for sua vez. Não feche esta página.
                </p>
              </div>
            ) : isAdmitted ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="font-display font-bold text-lg">É sua vez!</p>
                <p className="text-sm text-muted-foreground">
                  Você tem <span className="font-mono font-bold text-foreground">{timeLeft}</span> para completar sua compra.
                </p>
                <Button
                  onClick={() => navigate(`/eventos/${slug}`)}
                  className="w-full"
                >
                  Ir para o evento
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Sua sessão na fila expirou ou foi concluída.</p>
                <Button variant="outline" onClick={handleJoinQueue}>
                  Entrar novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
