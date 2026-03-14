import { Calendar, MapPin, MoreVertical, BarChart3, Users, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventImage } from "@/components/EventImage";
import { EventStatusBadge } from "@/components/EventStatusBadge";
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
  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-lg border border-border bg-card", className)}>
      <div className="w-24 h-16 rounded bg-muted overflow-hidden shrink-0 hidden sm:block">
        <EventImage src={coverImageUrl} alt="" className="w-full h-full" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-foreground truncate">{title}</h3>
          <EventStatusBadge status={status} />
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
