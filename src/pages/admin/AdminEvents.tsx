import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Star, StarOff, Ban, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAllEvents, adminUpdateEvent } from "@/lib/api-admin";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const statusMap: Record<string, string> = { draft: "pending", published: "active", cancelled: "cancelled", ended: "used" };

function FeeEditor({ eventId, currentFee, onSave }: { eventId: string; currentFee: number; onSave: (id: string, fee: number) => void }) {
  const [fee, setFee] = useState(currentFee);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted">
          <Percent className="h-3 w-3" />
          <span className="font-medium">{currentFee}%</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">Taxa da plataforma</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={fee}
              onChange={(e) => setFee(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Eventos gratuitos ignoram esta taxa.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => { onSave(eventId, fee); setOpen(false); }}>Salvar</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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

  const handleFeeUpdate = (id: string, fee: number) => {
    updateMutation.mutate({ id, updates: { platform_fee_percent: fee } });
  };

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
                    <th className="p-3 font-medium">Taxa</th>
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
                      <td className="p-3">
                        <FeeEditor eventId={event.id} currentFee={event.platform_fee_percent ?? 7} onSave={handleFeeUpdate} />
                      </td>
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
