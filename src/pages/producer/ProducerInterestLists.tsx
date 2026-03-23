import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerLists, deleteList, updateListStatus, getListFields, exportSubmissionsCSV } from "@/lib/api-interest-lists";
import type { InterestList } from "@/lib/api-interest-lists";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Copy, Pencil, Download, EyeOff, Eye, Trash2, Users, ClipboardList, Search, Sparkles, Gauge, BarChart3, CalendarDays, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  published: { label: "Publicada", variant: "default" },
  draft: { label: "Rascunho", variant: "secondary" },
  closed: { label: "Encerrada", variant: "destructive" },
};

export default function ProducerInterestLists() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<InterestList | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "closed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "30d">("30d");

  const { data: lists, isLoading } = useQuery({
    queryKey: ["interest-lists", user?.id],
    queryFn: () => getProducerLists(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interest-lists"] });
      toast({ title: "Lista excluída" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Erro ao excluir lista", variant: "destructive" }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateListStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interest-lists"] });
      toast({ title: "Status atualizado" });
    },
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/lista/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!" });
  };

  const handleExport = async (list: InterestList) => {
    try {
      const fields = await getListFields(list.id);
      const csv = await exportSubmissionsCSV(list.id, fields);
      if (!csv) { toast({ title: "Nenhuma inscrição para exportar" }); return; }
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${list.name.replace(/\s+/g, "-").toLowerCase()}-inscritos.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exportado!" });
    } catch {
      toast({ title: "Erro ao exportar", variant: "destructive" });
    }
  };


  const filteredLists = useMemo(() => {
    if (!lists) return [];

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return lists.filter((list) => {
      const matchesSearch = searchTerm.trim().length === 0
        || list.name.toLowerCase().includes(searchTerm.toLowerCase())
        || list.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || list.status === statusFilter;

      const createdAt = new Date(list.created_at).getTime();
      const matchesDate = dateFilter === "all" || createdAt >= thirtyDaysAgo;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [lists, searchTerm, statusFilter, dateFilter]);

  const metrics = useMemo(() => {
    const source = filteredLists;
    const activeLists = source.filter((list) => list.status === "published").length;
    const totalSubscribers = source.reduce((acc, list) => acc + (list.submissions_count || 0), 0);

    let conversionBase = 0;
    let conversionTotal = 0;
    source.forEach((list) => {
      const max = list.max_submissions || 0;
      if (max > 0) {
        conversionBase += 1;
        conversionTotal += ((list.submissions_count || 0) / max) * 100;
      }
    });

    const avgConversion = conversionBase > 0 ? conversionTotal / conversionBase : 0;

    return {
      activeLists,
      totalSubscribers,
      avgConversion,
    };
  }, [filteredLists]);

  const exportLatestVisible = async () => {
    if (!filteredLists.length) {
      toast({ title: "Nenhuma lista disponível para exportação" });
      return;
    }
    await handleExport(filteredLists[0]);
  };
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Listas de Interesse</h1>
            <p className="mt-1 text-sm text-muted-foreground">Operação de demanda com filtros inteligentes, contexto de conversão e ações rápidas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportLatestVisible}>
              <Download className="mr-2 h-4 w-4" />
              Exportar visível
            </Button>
            <Button onClick={() => navigate("/producer/interest-lists/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Nova lista
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-1">
            {[
              { key: "all", label: "Todas" },
              { key: "published", label: "Publicadas" },
              { key: "draft", label: "Rascunhos" },
              { key: "closed", label: "Encerradas" },
            ].map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={statusFilter === option.key ? "default" : "ghost"}
                onClick={() => setStatusFilter(option.key as typeof statusFilter)}
                className="h-8"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={dateFilter === "30d" ? "outline" : "ghost"}
              onClick={() => setDateFilter(dateFilter === "30d" ? "all" : "30d")}
            >
              <CalendarDays className="mr-1.5 h-4 w-4" />
              {dateFilter === "30d" ? "Últimos 30 dias" : "Todo período"}
            </Button>
            {(searchTerm || statusFilter !== "all" || dateFilter !== "30d") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("30d");
                }}
              >
                <Filter className="mr-1.5 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Listas ativas</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.activeLists}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inscritos totais</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.totalSubscribers.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Conversão média</p>
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metrics.avgConversion.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !lists?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhuma lista criada</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Crie uma lista de interesse para compartilhar com seu público e medir a demanda antes de abrir as vendas.
            </p>
            <Button onClick={() => navigate("/producer/interest-lists/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira lista
            </Button>
          </CardContent>
        </Card>
      ) : !filteredLists.length ? (
        <Card>
          <CardContent className="py-14 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Nenhuma lista com os filtros aplicados</h3>
            <p className="mt-1 text-sm text-muted-foreground">Ajuste seus filtros para visualizar campanhas cadastradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLists.map((list) => {
            const sc = statusConfig[list.status] || statusConfig.draft;
            const conversion = list.max_submissions && list.max_submissions > 0
              ? Math.min(100, ((list.submissions_count || 0) / list.max_submissions) * 100)
              : null;

            return (
              <Card key={list.id} className="border-border/70 transition-all hover:border-primary/30 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_auto_auto_auto_auto] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{list.name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">/{list.slug}</p>
                    </div>

                    <Badge variant={sc.variant} className="justify-self-start text-[10px]">{sc.label}</Badge>

                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{(list.submissions_count || 0).toLocaleString("pt-BR")}</p>
                      <p>inscritos</p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{conversion === null ? "--" : `${conversion.toFixed(0)}%`}</p>
                      <p>conversão</p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>{new Date(list.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                      <p>criação</p>
                    </div>
                  </div>

                  {conversion !== null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${conversion}%` }} />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(list.slug)}>
                          <Copy className="mr-2 h-4 w-4" /> Copiar link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/producer/interest-lists/${list.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(list)}>
                          <Download className="mr-2 h-4 w-4" /> Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {list.status === "published" ? (
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: list.id, status: "closed" })}>
                            <EyeOff className="mr-2 h-4 w-4" /> Despublicar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: list.id, status: "published" })}>
                            <Eye className="mr-2 h-4 w-4" /> Publicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(list)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lista</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Todas as inscrições serão perdidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
