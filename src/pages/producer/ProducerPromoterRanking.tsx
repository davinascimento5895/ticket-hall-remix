import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Users } from "lucide-react";
import { getPromoterRanking } from "@/lib/api-promoters";
import { getProducerEvents } from "@/lib/api-producer";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/lib/utils";

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function ProducerPromoterRanking({ producerId }: { producerId: string }) {
  const [eventFilter, setEventFilter] = useState("all");

  const { data: events = [] } = useQuery({
    queryKey: ["producer-events", producerId],
    queryFn: () => getProducerEvents(producerId),
    staleTime: 30_000,
  });

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ["promoter-ranking", producerId, eventFilter],
    queryFn: () => getPromoterRanking(producerId, eventFilter === "all" ? undefined : eventFilter),
    staleTime: 30_000,
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filtrar por evento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{ranking.length} promoter(s)</span>
      </div>

      {ranking.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhum promoter com vendas registradas.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {ranking.map((p: any, index: number) => {
            const RankIcon = rankIcons[index] || null;
            const rankColor = rankColors[index] || "text-muted-foreground";

            return (
              <Card key={p.promoter_id} className={index === 0 ? "border-yellow-500/30 bg-yellow-500/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                      {RankIcon ? (
                        <RankIcon className={`h-5 w-5 ${rankColor}`} />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{index + 1}º</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{p.name}</p>
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs">
                          {p.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>{p.eventsCount} evento(s)</span>
                        <span>{p.totalClicks} cliques</span>
                        <span>{p.totalConversions} conversões</span>
                        <span>Taxa: {p.totalClicks > 0 ? ((p.totalConversions / p.totalClicks) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-display font-bold">{formatBRL(p.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Comissão: {formatBRL(p.totalCommission)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
