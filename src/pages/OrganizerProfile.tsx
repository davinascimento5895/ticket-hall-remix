import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe, Instagram, Facebook, CalendarDays, MapPin } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";

export default function OrganizerProfile() {
  const { slug } = useParams();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["organizer-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organizer_slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["organizer-events", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("producer_id", profile!.id)
        .eq("status", "published")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const socialLinks = [
    { url: profile?.organizer_website, icon: Globe, label: "Site" },
    { url: profile?.organizer_instagram, icon: Instagram, label: "Instagram" },
    { url: profile?.organizer_facebook, icon: Facebook, label: "Facebook" },
  ].filter((l) => l.url);

  if (loadingProfile) {
    return (
      <>
        <div className="container pt-24 pb-16">
          <LoadingSkeleton variant="card" count={1} />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-16">
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="Organizador não encontrado"
            description="Não encontramos nenhum organizador com esse perfil."
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${profile.full_name || "Organizador"} — TicketHall`}
        description={profile.organizer_bio || `Eventos organizados por ${profile.full_name}`}
      />
      <Navbar />

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 to-accent/20 overflow-hidden">
        {profile.organizer_banner_url && (
          <img src={profile.organizer_banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="container -mt-16 relative z-10 pb-16">
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-8">
          {/* Avatar */}
          <div className="h-28 w-28 rounded-2xl border-4 border-background bg-card overflow-hidden flex-shrink-0 shadow-lg">
            {profile.organizer_logo_url || profile.avatar_url ? (
              <img src={profile.organizer_logo_url || profile.avatar_url || ""} alt={profile.full_name || ""} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary text-3xl font-bold font-display">
                {(profile.full_name || "O")[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="pt-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{profile.full_name}</h1>
            {profile.organizer_bio && (
              <p className="text-muted-foreground mt-1 max-w-2xl">{profile.organizer_bio}</p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <link.icon className="h-4 w-4" /> {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="font-display text-xl font-bold mb-4">Eventos</h2>

        {loadingEvents ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : !events || events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="Nenhum evento publicado"
            description="Este organizador ainda não possui eventos publicados."
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <EventCard
                key={event.id}
                title={event.title}
                date={new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                city={event.venue_city || "Online"}
                imageUrl={event.cover_image_url || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80"}
                priceFrom={0}
                category={event.category}
                slug={event.slug}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
