import { Calendar, MapPin, MoreVertical, BarChart3, Users, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProducerEventCardProps {
  id: string;
  title: string;
  slug: string;
  status: string;
  startDate: string;
  venueCity?: string | null;
  coverImageUrl?: string | null;
  ticketsSold?: number;
  totalCapacity?: number;
  className?: string;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  draft: { label: "Rascunho", classes: "bg-muted text-muted-foreground" },
  published: { label: "Publicado", classes: "bg-success/15 text-success" },
  cancelled: { label: "Cancelado", classes: "bg-destructive/15 text-destructive" },
  completed: { label: "Encerrado", classes: "bg-muted text-muted-foreground" },
};

export function ProducerEventCard({
  id,
  title,
  status,
  startDate,
  venueCity,
  coverImageUrl,
  ticketsSold = 0,
  totalCapacity,
  className,
}: ProducerEventCardProps) {
  const st = statusMap[status] || statusMap.draft;

  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-lg border border-border bg-card", className)}>
      <div className="w-24 h-16 rounded bg-muted overflow-hidden shrink-0 hidden sm:block">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">{title}</h3>
          <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", st.classes)}>{st.label}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(startDate).toLocaleDateString("pt-BR")}
          </span>
          {venueCity && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {venueCity}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Ticket className="h-3 w-3" />
            {ticketsSold}{totalCapacity ? `/${totalCapacity}` : ""} vendidos
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/producer/events/${id}/edit`}>Editar</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/producer/events/${id}/reports`}>
              <BarChart3 className="h-4 w-4 mr-2" /> Relatórios
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/producer/events/${id}/orders`}>
              <Users className="h-4 w-4 mr-2" /> Pedidos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/producer/events/${id}/checkin`}>Check-in</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
