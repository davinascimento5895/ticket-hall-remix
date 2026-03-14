import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, MoreHorizontal, Eye, BarChart3, Users, Edit, Trash2, ShoppingCart, ScanLine, UserPlus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getProducerEvents } from "@/lib/api-producer";
import { useNavigate } from "react-router-dom";

export default function ProducerEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ["producer-events", user?.id],
    queryFn: () => getProducerEvents(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Meus Eventos</h1>
        <Button asChild>
          <Link to="/producer/events/new" className="gap-2">
            <Plus className="h-4 w-4" /> Criar evento
          </Link>
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-12 w-12" />}
          title="Nenhum evento criado"
          description="Crie seu primeiro evento e comece a vender ingressos."
          actionLabel="Criar evento"
          onAction={() => navigate("/producer/events/new")}
        />
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => {
            const totalSold = event.ticket_tiers?.reduce((s: number, t: any) => s + (t.quantity_sold || 0), 0) || 0;
            const totalCapacity = event.ticket_tiers?.reduce((s: number, t: any) => s + (t.quantity_total || 0), 0) || 0;

            return (
              <div key={event.id} onClick={() => navigate(`/producer/events/${event.id}/panel`)} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                {event.cover_image_url && (
                  <img src={event.cover_image_url} alt="" className="w-16 h-16 rounded object-cover hidden sm:block" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-foreground truncate">{event.title}</h3>
                    <EventStatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.start_date).toLocaleDateString("pt-BR")}
                    {event.venue_city ? ` · ${event.venue_city}` : ""}
                    {` · ${totalSold}/${totalCapacity} vendidos`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel`}><BarChart3 className="h-4 w-4 mr-2" />Painel do evento</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/eventos/${event.slug}`}><Eye className="h-4 w-4 mr-2" />Ver página</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/edit`}><Edit className="h-4 w-4 mr-2" />Editar</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/participants`}><Users className="h-4 w-4 mr-2" />Participantes</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/checkin`}><ScanLine className="h-4 w-4 mr-2" />Check-in</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/financial`}><ShoppingCart className="h-4 w-4 mr-2" />Financeiro</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to={`/producer/events/${event.id}/panel/coupons`}><Tag className="h-4 w-4 mr-2" />Cupons</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
