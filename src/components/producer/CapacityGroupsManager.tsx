import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCapacityGroups, createCapacityGroup, deleteCapacityGroup } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
}

export function CapacityGroupsManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(100);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["capacity-groups", eventId],
    queryFn: () => getCapacityGroups(eventId),
  });

  const createMut = useMutation({
    mutationFn: () => createCapacityGroup({ event_id: eventId, name: name.trim(), capacity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacity-groups", eventId] });
      setName("");
      setCapacity(100);
      toast({ title: "Grupo de capacidade criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCapacityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capacity-groups", eventId] });
      toast({ title: "Grupo removido" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Grupos de Capacidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Crie pools de vagas compartilhados entre múltiplos lotes. Ex: "Área VIP" com 200 vagas divididas entre "VIP Early Bird" e "VIP Regular".</p>

        {!isLoading && groups.length > 0 && (
          <div className="space-y-2">
            {groups.map((g: any) => {
              const pct = g.capacity > 0 ? Math.round((g.sold_count / g.capacity) * 100) : 0;
              return (
                <div key={g.id} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.sold_count}/{g.capacity} vendidos</p>
                    </div>
                    <button onClick={() => deleteMut.mutate(g.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Novo grupo</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Área VIP" maxLength={100} />
            </div>
            <div>
              <Label className="text-xs">Capacidade total</Label>
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!name.trim() || capacity <= 0 || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Criar grupo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
