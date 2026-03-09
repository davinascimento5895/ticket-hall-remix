import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducers, updateProducerStatus } from "@/lib/api-admin";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pendente", classes: "bg-warning/15 text-warning border-warning/20" },
  approved: { label: "Aprovado", classes: "bg-success/15 text-success border-success/20" },
  rejected: { label: "Rejeitado", classes: "bg-destructive/15 text-destructive border-destructive/20" },
  suspended: { label: "Suspenso", classes: "bg-muted text-muted-foreground border-border" },
};

export default function AdminProducers() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: producers, isLoading } = useQuery({
    queryKey: ["admin-producers", statusFilter],
    queryFn: () => getProducers(statusFilter !== "all" ? statusFilter : undefined),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) => updateProducerStatus(userId, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-producers"] }); toast({ title: "Status atualizado!" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovados" },
    { value: "rejected", label: "Rejeitados" },
    { value: "suspended", label: "Suspensos" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Produtores</h1>

      <div className="flex gap-1 flex-wrap">
        {statuses.map((s) => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statusFilter === s.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !producers || producers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produtor encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {producers.map((p: any) => {
                const st = statusConfig[p.producer_status] || statusConfig.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{p.full_name || "Sem nome"}</p>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${st.classes}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.phone || "—"} · Cadastro: {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.producer_status !== "approved" && (
                        <Button size="sm" variant="outline" className="gap-1 text-success border-success/30 hover:bg-success/10" onClick={() => mutation.mutate({ userId: p.id, status: "approved" })}>
                          <CheckCircle2 className="h-4 w-4" />Aprovar
                        </Button>
                      )}
                      {p.producer_status !== "rejected" && p.producer_status !== "suspended" && (
                        <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => mutation.mutate({ userId: p.id, status: "rejected" })}>
                          <XCircle className="h-4 w-4" />Rejeitar
                        </Button>
                      )}
                      {p.producer_status === "approved" && (
                        <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => mutation.mutate({ userId: p.id, status: "suspended" })}>
                          <Ban className="h-4 w-4" />Suspender
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
