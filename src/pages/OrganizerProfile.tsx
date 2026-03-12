import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Instagram, Facebook, CalendarDays, Heart, Mail } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { EventCard } from "@/components/EventCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthModal } from "@/components/AuthModal";
import { ContactProducerModal } from "@/components/ContactProducerModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function OrganizerProfile() {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showContact, setShowContact] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Follow status
  const { data: isFollowing } = useQuery({
    queryKey: ["producer-follow", profile?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("producer_follows")
        .select("id")
        .eq("user_id", user!.id)
        .eq("producer_id", profile!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.id && !!user?.id,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["producer-followers-count", profile?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("producer_follows")
        .select("id", { count: "exact", head: true })
        .eq("producer_id", profile!.id);
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Login required");
      if (isFollowing) {
        await supabase
          .from("producer_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("producer_id", profile.id);
      } else {
        await supabase
          .from("producer_follows")
          .insert({ user_id: user.id, producer_id: profile.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-follow", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["producer-followers-count", profile?.id] });
      toast({
        title: isFollowing ? "Deixou de seguir" : "Seguindo!",
        description: isFollowing
          ? `Você deixou de seguir ${profile?.full_name}.`
          : `Agora você segue ${profile?.full_name}.`,
      });
    },
    onError: () => {
      toast({ title: "Faça login", description: "Você precisa estar logado para seguir produtores.", variant: "destructive" });
    },
  });

  const now = new Date();
  const upcomingEvents = events?.filter((e: any) => new Date(e.end_date) >= now) || [];
  const pastEvents = events?.filter((e: any) => new Date(e.end_date) < now) || [];

  const socialLinks = [
    { url: profile?.organizer_website, icon: Globe, label: "Site" },
    { url: profile?.organizer_instagram, icon: Instagram, label: "Instagram" },
    { url: profile?.organizer_facebook, icon: Facebook, label: "Facebook" },
  ].filter((l) => l.url);

  if (loadingProfile) {
    return (
      <div className="container pt-24 pb-16">
        <LoadingSkeleton variant="card" count={1} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container pt-24 pb-16">
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="Organizador não encontrado"
          description="Não encontramos nenhum organizador com esse perfil."
        />
      </div>
    );
  }

  const renderEventGrid = (list: any[]) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="Nenhum evento"
          description="Nenhum evento nesta categoria no momento."
        />
      );
    }
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {list.map((event: any) => (
          <EventCard
            key={event.id}
            title={event.title}
            date={new Date(event.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            city={event.is_online ? "Evento Online" : (event.venue_city ? `${event.venue_name ? event.venue_name + " - " : ""}${event.venue_city}${event.venue_state ? ", " + event.venue_state : ""}` : "Online")}
            imageUrl={event.cover_image_url || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80"}
            priceFrom={0}
            category={event.category}
            slug={event.slug}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <SEOHead
        title={`${profile.full_name || "Organizador"} — TicketHall`}
        description={profile.organizer_bio || `Eventos organizados por ${profile.full_name}`}
      />

      {/* Banner - full width */}
      <div className="relative h-48 md:h-72 lg:h-80 bg-gradient-to-br from-primary/30 to-accent/20 overflow-hidden">
        {profile.organizer_banner_url && (
          <img
            src={profile.organizer_banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>

      <div className="container relative z-10 pb-16">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 -mt-16 mb-4">
          {/* Avatar */}
          <div className="h-28 w-28 lg:h-36 lg:w-36 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 shadow-lg">
            {profile.organizer_logo_url || profile.avatar_url ? (
              <img
                src={profile.organizer_logo_url || profile.avatar_url || ""}
                alt={profile.full_name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary text-4xl font-bold font-display">
                {(profile.full_name || "O")[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 pt-2 sm:pt-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {profile.full_name}
            </h1>
            {followerCount !== undefined && followerCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 sm:pt-8">
            <Button
              variant={isFollowing ? "default" : "outline"}
              className="gap-2"
              onClick={handleFollowClick}
              disabled={toggleFollow.isPending}
            >
              <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowContact(true)}
            >
              <Mail className="h-4 w-4" />
              Fale com o produtor
            </Button>
          </div>
        </div>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex gap-4 mb-6 ml-0 sm:ml-[calc(7rem+1.25rem)] lg:ml-[calc(9rem+1.25rem)]">
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

        {/* Tabs: Disponíveis / Encerrados */}
        <Tabs defaultValue="available" className="mt-6">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 px-0 h-auto pb-0">
            <TabsTrigger
              value="available"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium"
            >
              Disponíveis
              {upcomingEvents.length > 0 && (
                <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {upcomingEvents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 text-sm font-medium"
            >
              Encerrados
              {pastEvents.length > 0 && (
                <span className="ml-2 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {pastEvents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-8">
            {loadingEvents ? <LoadingSkeleton variant="card" count={4} /> : renderEventGrid(upcomingEvents)}
          </TabsContent>

          <TabsContent value="past" className="mt-8">
            {loadingEvents ? <LoadingSkeleton variant="card" count={4} /> : renderEventGrid(pastEvents)}
          </TabsContent>
        </Tabs>

        {/* About section */}
        {profile.organizer_bio && (
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <h2 className="font-display text-xl font-bold mb-6">Sobre o produtor</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {profile.organizer_bio}
            </p>
          </div>
        )}
      </div>

      {/* Contact modal */}
      <ContactProducerModal
        open={showContact}
        onOpenChange={setShowContact}
        producerId={profile.id}
        producerName={profile.full_name || "Produtor"}
      />
    </>
  );
}
