import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getEventStatusLabel } from "@/components/EventStatusBadge";

export interface AdminEventOption {
  id: string;
  title: string;
  status?: string | null;
  start_date?: string | null;
  venue_city?: string | null;
  is_featured?: boolean | null;
}

interface EventPickerProps {
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  events: AdminEventOption[];
  placeholder?: string;
  className?: string;
  allowAll?: boolean;
}

export function EventPicker({
  value,
  onValueChange,
  events,
  placeholder = "Filtrar por evento",
  className,
  allowAll = true,
}: EventPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedEvent = useMemo(() => events.find((event) => event.id === value), [events, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 min-w-[220px] justify-between border-border/80 bg-background/80 text-sm shadow-sm backdrop-blur-sm",
            className,
          )}
        >
          <span className="truncate">
            {selectedEvent ? selectedEvent.title : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 shadow-xl" align="end">
        <Command>
          <CommandInput placeholder="Buscar evento..." />
          <CommandList>
            <CommandEmpty>Nenhum evento encontrado.</CommandEmpty>
            <CommandGroup heading="Eventos">
              {allowAll && (
                <CommandItem
                  value="todos"
                  onSelect={() => {
                    onValueChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Todos os eventos
                  </span>
                  {!value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              )}

              {allowAll && events.length > 0 && <CommandSeparator />}

              {events.map((event) => (
                <CommandItem
                  key={event.id}
                  value={`${event.title} ${event.venue_city || ""} ${event.status || ""}`}
                  onSelect={() => {
                    onValueChange(event.id);
                    setOpen(false);
                  }}
                  className="items-start gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium leading-none">{event.title}</span>
                      {event.is_featured ? (
                        <Badge className="h-5 border-0 bg-accent/15 px-1.5 text-[10px] text-accent">Destaque</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {event.venue_city || "Sem cidade"}
                      {event.start_date ? ` · ${format(new Date(event.start_date), "dd MMM yyyy", { locale: ptBR })}` : ""}
                    </p>
                    {event.status ? (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {getEventStatusLabel(event.status)}
                      </p>
                    ) : null}
                  </div>
                  {value === event.id && <Check className="h-4 w-4 shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}