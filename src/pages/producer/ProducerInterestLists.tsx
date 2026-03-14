import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerLists, deleteList, updateListStatus, getListFields, exportSubmissionsCSV } from "@/lib/api-interest-lists";
import type { InterestList } from "@/lib/api-interest-lists";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, MoreVertical, Copy, Pencil, Download, EyeOff, Eye, Trash2, Users, ClipboardList } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listas de Interesse</h1>
          <p className="text-sm text-muted-foreground">Meça o interesse do público antes de criar seu evento.</p>
        </div>
        <Button onClick={() => navigate("/producer/interest-lists/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova lista
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-20" /></CardContent></Card>
          ))}
        </div>
      ) : !lists?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma lista criada</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Crie uma lista de interesse para compartilhar com seu público e medir a demanda antes de criar seu evento.
            </p>
            <Button onClick={() => navigate("/producer/interest-lists/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira lista
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const sc = statusConfig[list.status] || statusConfig.draft;
            return (
              <Card key={list.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{list.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
                        {list.expires_at && new Date(list.expires_at) < new Date() && (
                          <Badge variant="outline" className="text-[10px]">Expirada</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(list.slug)}>
                          <Copy className="h-4 w-4 mr-2" /> Copiar link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/producer/interest-lists/${list.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(list)}>
                          <Download className="h-4 w-4 mr-2" /> Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {list.status === "published" ? (
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: list.id, status: "closed" })}>
                            <EyeOff className="h-4 w-4 mr-2" /> Despublicar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => statusMut.mutate({ id: list.id, status: "published" })}>
                            <Eye className="h-4 w-4 mr-2" /> Publicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(list)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold text-foreground text-lg">{list.submissions_count}</span>
                    <span>inscritos</span>
                    {list.max_submissions && (
                      <span className="text-xs">/ {list.max_submissions}</span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Criada em {new Date(list.created_at).toLocaleDateString("pt-BR")}
                  </p>
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
