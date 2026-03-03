import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Star, StarOff, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getAllEvents, adminUpdateEvent } from "@/lib/api-admin";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const statusMap: Record<string, string> = { draft: "pending", published: "active", cancelled: "cancelled", ended: "used" };

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events", statusFilter, search],
    queryFn: () => getAllEvents({ status: statusFilter, search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) => adminUpdateEvent(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-events"] }); toast({ title: "Evento atualizado!" }); },
  });

  const statuses = [
    { value: "all", label: "Todos" },
    { value: "draft", label: "Rascunho" },
    { value: "published", label: "Publicado" },
    { value: "cancelled", label: "Cancelado" },
    { value: "ended", label: "Encerrado" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Todos os Eventos</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar evento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${statusFilter === s.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Produtor</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Destaque</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event: any) => (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-medium max-w-[200px] truncate">{event.title}</td>
                      <td className="p-3 text-muted-foreground">{event.profiles?.full_name || "—"}</td>
                      <td className="p-3"><OrderStatusBadge status={statusMap[event.status] || event.status} /></td>
                      <td className="p-3 text-muted-foreground">{new Date(event.start_date).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3">
                        <button onClick={() => updateMutation.mutate({ id: event.id, updates: { is_featured: !event.is_featured } })} className="text-muted-foreground hover:text-accent transition-colors">
                          {event.is_featured ? <Star className="h-4 w-4 fill-accent text-accent" /> : <StarOff className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="p-3">
                        {event.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateMutation.mutate({ id: event.id, updates: { status: "cancelled" } })}>
                            <Ban className="h-4 w-4 mr-1" />Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
