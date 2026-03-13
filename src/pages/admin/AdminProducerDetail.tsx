import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getProducerDetail } from "@/lib/api-admin";

const statusMap: Record<string, string> = {
  draft: "pending",
  published: "active",
  cancelled: "cancelled",
  ended: "used",
};

export default function AdminProducerDetail() {
  const { producerId } = useParams<{ producerId: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-producer-detail", producerId],
    queryFn: () => getProducerDetail(producerId!),
    enabled: !!producerId,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/producers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">
            {isLoading ? "Carregando..." : data?.profile?.full_name || "Produtor"}
          </h1>
          {data?.profile && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              {data.profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {data.profile.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Cadastro: {new Date(data.profile.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.events || data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Este produtor ainda não criou nenhum evento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Evento</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event: any) => (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-medium max-w-[250px] truncate">{event.title}</td>
                      <td className="p-3">
                        <OrderStatusBadge status={statusMap[event.status] || event.status} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString("pt-BR")}
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
