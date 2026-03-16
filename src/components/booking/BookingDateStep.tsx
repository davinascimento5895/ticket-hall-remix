import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  event: {
    start_date: string;
    end_date: string;
    is_multi_day: boolean | null;
    venue_name: string | null;
    venue_city: string | null;
  };
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function BookingDateStep({ event, selectedDate, onSelectDate }: Props) {
  const isMobile = useIsMobile();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = event.is_multi_day || startDate.toDateString() !== endDate.toDateString();

  // For single-day events, just show the date and proceed
  if (!isMultiDay) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Data do evento</p>
          <p className="text-2xl font-bold">
            {format(startDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(startDate, "EEEE, HH:mm", { locale: ptBR })}
            {event.venue_name && ` · ${event.venue_name}`}
          </p>
        </div>
        <Button className="w-full" size="lg" onClick={() => onSelectDate(startDate)}>
          Selecionar ingressos
        </Button>
      </div>
    );
  }

  // Multi-day: show date picker
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Selecione a data</p>
        {event.venue_name && (
          <p className="text-xs text-muted-foreground">{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}</p>
        )}
      </div>

      {/* Native date input on mobile */}
      {isMobile ? (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              min={format(startDate, "yyyy-MM-dd")}
              max={format(endDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDate(new Date(e.target.value + "T12:00:00"));
                }
              }}
              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground text-base appearance-none"
            />
            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <Button className="w-full" size="lg" onClick={() => onSelectDate(selectedDate)}>
            Continuar
          </Button>
        </div>
      ) : (
        /* Visual calendar on desktop */
        <div className="flex flex-col items-center space-y-4">
          <Calendar
            value={selectedDate ? { start: selectedDate, end: selectedDate } : null}
            onChange={(range) => {
              if (range?.start) onSelectDate(range.start);
            }}
            minValue={startDate}
            maxValue={endDate}
          />
          <p className="text-sm text-muted-foreground">
            Selecionado: {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      )}
    </div>
  );
}
