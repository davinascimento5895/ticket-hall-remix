import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, CalendarDays, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoWhite from "@/assets/logo-full-white.svg";
import logoBlack from "@/assets/logo-full-black.svg";

interface StaffEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_city: string | null;
  cover_image_url: string | null;
  status: string | null;
}

function getEventBadge(start: string, end: string) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (isPast(e)) return { label: "ENCERRADO", variant: "secondary" as const };
  if (isWithinInterval(now, { start: s, end: e })) return { label: "EM ANDAMENTO", variant: "default" as const };
  return { label: "EM BREVE", variant: "outline" as const };
}

export default function StaffEventList() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/?login=true", { replace: true });
      return;
    }

    (async () => {
      let evts: StaffEvent[] = [];

      if (role === "admin") {
        // Admin sees all published/draft events
        const { data } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
          .in("status", ["published", "draft"])
          .order("start_date", { ascending: false })
          .limit(50);
        evts = data || [];
      } else if (role === "producer") {
        // Producer sees their own events
        const { data } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
          .eq("producer_id", user.id)
          .order("start_date", { ascending: false });
        evts = data || [];
      } else {
        // Staff sees only assigned events via event_staff
        const { data: assignments } = await supabase
          .from("event_staff")
          .select("event_id")
          .eq("user_id", user.id);

        if (assignments?.length) {
          const eventIds = assignments.map((a) => a.event_id);
          const { data } = await supabase
            .from("events")
            .select("id, title, start_date, end_date, venue_name, venue_city, cover_image_url, status")
            .in("id", eventIds)
            .order("start_date", { ascending: false });
          evts = data || [];
        }
      }

      setEvents(evts);
      setFetching(false);
    })();
  }, [user, role, loading, navigate]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <img src={logoBlack} alt="TicketHall" className="h-7 dark:hidden" />
        <img src={logoWhite} alt="TicketHall" className="h-7 hidden dark:block" />
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </Button>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <h1 className="text-xl font-bold font-[family-name:var(--font-display)] mb-4">
          {role === "admin" ? "Todos os Eventos" : role === "producer" ? "Seus Eventos" : "Eventos Atribuídos"}
        </h1>

        {events.length === 0 ? (
          <p className="text-muted-foreground text-center mt-12">
            Nenhum evento encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => {
              const badge = getEventBadge(evt.start_date, evt.end_date);
              const isEnded = badge.label === "ENCERRADO";

              return (
                <Card
                  key={evt.id}
                  className={`overflow-hidden transition-all cursor-pointer active:scale-[0.98] ${isEnded ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !isEnded && navigate(`/staff/checkin/${evt.id}`)}
                >
                  <CardContent className="p-0 flex">
                    {evt.cover_image_url && (
                      <img
                        src={evt.cover_image_url}
                        alt=""
                        className="w-20 h-20 object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="p-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-sm truncate">{evt.title}</h2>
                        <Badge variant={badge.variant} className="text-[10px] flex-shrink-0 whitespace-nowrap">
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 flex-shrink-0" />
                          {format(new Date(evt.start_date), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {format(new Date(evt.start_date), "HH:mm", { locale: ptBR })}
                        </div>
                        {evt.venue_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{evt.venue_name}{evt.venue_city ? `, ${evt.venue_city}` : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
