import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronRight, CalendarDays, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProducers, getPendingProducers, approveProducer, rejectProducer } from "@/lib/api-admin";
import { maskCPF } from "@/lib/validators";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminProducers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: pendingProducers, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-pending-producers"],
    queryFn: getPendingProducers,
    staleTime: 30_000,
  });

  const { data: producers, isLoading } = useQuery({
    queryKey: ["admin-producers", debouncedSearch],
    queryFn: () => getProducers(debouncedSearch || undefined),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: approveProducer,
    onSuccess: () => {
      toast.success("Produtor aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-producers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-producers"] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao aprovar produtor");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectProducer,
    onSuccess: () => {
      toast.success("Solicitação rejeitada");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-producers"] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao rejeitar solicitação");
    },
  });

  const hasPending = pendingProducers && pendingProducers.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Produtores</h1>

      {/* Pending Requests Section */}
      {pendingLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : hasPending ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-500" />
              Solicitações pendentes
              <Badge variant="secondary" className="ml-2">
                {pendingProducers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingProducers.map((p: any) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{p.full_name || "Sem nome"}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {p.cpf && <span>CPF: {maskCPF(p.cpf)}</span>}
                    {p.phone && <span>Tel: {p.phone}</span>}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectMutation.mutate(p.id)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1.5 text-destructive" />
                    )}
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(p.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    )}
                    Aprovar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Approved Producers List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Produtores ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !producers || producers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produtor encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {producers.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/admin/producers/${p.id}`)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{p.full_name || "Sem nome"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {p.phone && <span>{p.phone}</span>}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span>{p.events_count ?? 0} evento(s)</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
