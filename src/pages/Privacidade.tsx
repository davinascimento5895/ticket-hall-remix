import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Download, Trash2, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CONSENT_TYPES = [
  { key: "terms", label: "Termos de Uso", description: "Aceite dos termos de uso da plataforma.", required: true },
  { key: "data_processing", label: "Processamento de Dados", description: "Consentimento para processamento de dados pessoais conforme a LGPD.", required: true },
  { key: "marketing", label: "Comunicações de Marketing", description: "Receber emails promocionais e novidades sobre eventos.", required: false },
];

export default function Privacidade() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);

  // Load consents
  const { data: consents = [], isLoading: loadingConsents } = useQuery({
    queryKey: ["lgpd-consents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_consents")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Load data requests
  const { data: requests = [] } = useQuery({
    queryKey: ["lgpd-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_data_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const consentMutation = useMutation({
    mutationFn: async ({ consentType, granted }: { consentType: string; granted: boolean }) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("lgpd_consents").upsert({
        user_id: user!.id,
        consent_type: consentType,
        granted,
        granted_at: granted ? now : null,
        revoked_at: granted ? null : now,
      }, { onConflict: "user_id,consent_type" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-consents"] });
      toast({ title: "Preferência atualizada" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("lgpd-data", {
        body: { action: "export" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-tickethall-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      queryClient.invalidateQueries({ queryKey: ["lgpd-requests"] });
      toast({ title: "Dados exportados!", description: "O download começou automaticamente." });
    } catch (err: any) {
      toast({ title: "Erro ao exportar", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const deletionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("lgpd-data", {
        body: { action: "delete" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lgpd-requests"] });
      toast({ title: "Solicitação registrada", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const getConsentValue = (type: string) => {
    const consent = consents.find((c: any) => c.consent_type === type);
    return consent?.granted || false;
  };

  const hasPendingDeletion = requests.some((r: any) => r.request_type === "deletion" && r.status === "pending");

  return (
    <>
      <SEOHead title="Privacidade e Dados" description="Gerencie seus dados e privacidade na TicketHall." />
      <div className="container pt-24 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Privacidade e Dados</h1>
        </div>

        {/* Consents */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Consentimentos</CardTitle>
            <CardDescription>Gerencie seus consentimentos conforme a LGPD (Lei Geral de Proteção de Dados).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CONSENT_TYPES.map((ct) => (
              <div key={ct.key} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{ct.label}</Label>
                  <p className="text-xs text-muted-foreground">{ct.description}</p>
                </div>
                <Switch
                  checked={getConsentValue(ct.key)}
                  disabled={ct.required && getConsentValue(ct.key)}
                  onCheckedChange={(checked) =>
                    consentMutation.mutate({ consentType: ct.key, granted: checked })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Exportar Meus Dados</CardTitle>
            <CardDescription>Baixe uma cópia de todos os seus dados pessoais armazenados na plataforma (perfil, pedidos, ingressos, consentimentos).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Exportando..." : "Exportar dados (JSON)"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="mb-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Excluir Conta</CardTitle>
            <CardDescription>
              Solicite a exclusão permanente da sua conta e todos os dados associados.
              Esta ação é irreversível e será processada em até 15 dias úteis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPendingDeletion ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">Pendente</Badge>
                Solicitação de exclusão em andamento.
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Solicitar exclusão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao confirmar, sua conta e todos os dados serão permanentemente excluídos em até 15 dias.
                      Ingressos ativos serão cancelados e não poderão ser recuperados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deletionMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* Request History */}
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">
                        {req.request_type === "export" ? "Exportação de dados" : "Exclusão de conta"}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(req.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </span>
                    </div>
                    <Badge variant="outline" className={
                      req.status === "completed" ? "text-green-600 border-green-600/30" :
                      req.status === "pending" ? "text-yellow-600 border-yellow-600/30" :
                      "text-muted-foreground"
                    }>
                      {req.status === "completed" && <Check className="h-3 w-3 mr-1" />}
                      {req.status === "pending" ? "Pendente" : req.status === "completed" ? "Concluído" : req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
