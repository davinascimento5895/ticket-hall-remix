import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Share2, Users, ArrowLeft, Lock, Package, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getCategoryLabel } from "@/lib/categories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TicketTierCard } from "@/components/TicketTierCard";
import { SEOHead } from "@/components/SEOHead";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareSheet } from "@/components/ShareSheet";
import { EventReviews } from "@/components/EventReviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getEventBySlug, getEventTiers } from "@/lib/api";
import { getEventProducts } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [unlockCode, setUnlockCode] = useState("");
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const initialTab = new URLSearchParams(window.location.search).get("tab");
  const [activeSection, setActiveSection] = useState<"description" | "tickets" | "venue">(
    initialTab === "tickets" || initialTab === "venue" ? initialTab : "tickets"
  );

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", slug],
    queryFn: () => getEventBySlug(slug!),
    enabled: !!slug,
  });

  const { setTrackingCode } = useCart();

  // Track promoter click from ?ref=CODE (M03: atomic increment)
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref || !event?.id) return;
    const trackedKey = `promoter_tracked_${event.id}_${ref}`;
    if (sessionStorage.getItem(trackedKey)) return;
    sessionStorage.setItem(trackedKey, "1");
    setTrackingCode(ref);
    supabase
      .from("promoter_events")
      .select("id")
      .eq("tracking_code", ref)
      .eq("event_id", event.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          supabase.rpc("increment_promoter_clicks", { p_promoter_event_id: data.id }).then(() => {});
        }
      });
  }, [event?.id, searchParams, setTrackingCode]);

  const { data: allTiers, isLoading: loadingTiers } = useQuery({
    queryKey: ["event-tiers-all", event?.id],
    queryFn: async () => {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", event!.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!event?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["event-products", event?.id],
    queryFn: () => getEventProducts(event!.id),
    enabled: !!event?.id,
  });

  // Fetch producer profile
  const { data: producer } = useQuery({
    queryKey: ["producer-profile", event?.producer_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, organizer_slug, organizer_logo_url, organizer_bio")
        .eq("id", event!.producer_id)
        .single();
      return data;
    },
    enabled: !!event?.producer_id,
  });

  const { addItem } = useCart();

  useRealtimeSubscription({
    table: "tickets",
    filter: event?.id ? `event_id=eq.${event.id}` : undefined,
    queryKey: ["event-tiers-all", event?.id || ""],
    enabled: !!event?.id,
  });

  // M03: Atomic increment views_count once per session per event
  useEffect(() => {
    if (!event?.id) return;
    const viewedKey = `event_viewed_${event.id}`;
    if (sessionStorage.getItem(viewedKey)) return;
    sessionStorage.setItem(viewedKey, "1");
    supabase.rpc("increment_event_views", { p_event_id: event.id }).then(() => {});
  }, [event?.id]);

  // A08: Filter tiers - hidden ones only shown if their ID is in revealedTierIds
  const [revealedTierIds, setRevealedTierIds] = useState<string[]>([]);

  const tiers = allTiers?.filter((t: any) => {
    if (!t.is_visible) return false;
    if (t.is_hidden_by_default) {
      return revealedTierIds.includes(t.id);
    }
    return true;
  }) || [];

  const hasHiddenTiers = allTiers?.some((t: any) => t.is_hidden_by_default && t.is_visible) || false;

  // A08: Validate unlock code server-side
  const handleUnlock = async () => {
    const code = unlockCode.trim();
    if (!code || !event?.id) return;
    const { data: tierIds, error } = await supabase.rpc("validate_unlock_code", {
      p_event_id: event.id,
      p_code: code,
    });
    if (error || !tierIds || (tierIds as string[]).length === 0) {
      toast({ title: "Código inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
    } else {
      setRevealedTierIds((prev) => [...prev, ...(tierIds as string[])]);
      setUnlockCode("");
      setShowUnlockInput(false);
      toast({ title: "Código válido!", description: "Ingressos exclusivos revelados." });
    }
  };

  const [showCartCTA, setShowCartCTA] = useState(false);
  const [lastAddedTierName, setLastAddedTierName] = useState("");

  const handleAddToCart = (tierId: string, quantity: number) => {
    const tier = allTiers?.find((t: any) => t.id === tierId);
    if (!tier || !event) return;
    addItem({
      tierId: tier.id, eventId: event.id, tierName: tier.name,
      eventTitle: event.title, eventSlug: event.slug,
      price: tier.price ?? 0, quantity,
      coverImageUrl: event.cover_image_url ?? undefined,
      platformFeePercent: event.platform_fee_percent ?? 7,
      maxPerOrder: tier.max_per_order ?? 10,
    });
    setLastAddedTierName(tier.name);
    setShowCartCTA(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  const isPastEvent = event ? new Date(event.end_date) < new Date() : false;

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  if (loadingEvent) {
    return (
      <>
        <div><Skeleton className="w-full h-[340px]" />
          <div className="container py-8 space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-1/3" /></div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">O evento que você procura não existe ou foi removido.</p>
          <Button asChild><Link to="/eventos">Ver todos os eventos</Link></Button>
        </div>
      </>
    );
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const sections = [
    { id: "description" as const, label: "Sobre" },
    { id: "tickets" as const, label: "Ingressos" },
    { id: "venue" as const, label: "Local" },
  ];

  const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map((t: any) => t.price ?? 0)) : null;

  return (
    <div className="pb-[144px] lg:pb-0">
      <SEOHead
        title={event.title}
        description={event.description?.slice(0, 155) || `Compre ingressos para ${event.title} no TicketHall`}
        ogImage={event.cover_image_url || undefined}
        ogType="event"
        canonicalUrl={`${window.location.origin}/eventos/${event.slug}`}
        jsonLd={{
          "@context": "https://schema.org", "@type": "Event",
          name: event.title, startDate: event.start_date, endDate: event.end_date,
          location: event.is_online
            ? { "@type": "VirtualLocation", url: event.online_url }
            : { "@type": "Place", name: event.venue_name, address: { "@type": "PostalAddress", addressLocality: event.venue_city, addressRegion: event.venue_state } },
          image: event.cover_image_url, description: event.description,
          organizer: { "@type": "Organization", name: "TicketHall" },
        }}
      />

      {/* Cover image - cinematic */}
      <div className="relative w-full h-[300px] lg:h-[420px] bg-secondary overflow-hidden">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <FavoriteButton eventId={event.id} size="md" className="absolute top-4 right-4" />
      </div>

      <div className="container relative -mt-28 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Back + category badge */}
            <div>
              <Link to="/eventos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Link>
              {event.category && (
                <span className="ml-3 inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-primary/90 text-primary-foreground">
                  {getCategoryLabel(event.category)}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">{event.title}</h1>

            {/* Meta row with icons */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {format(startDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                {" › "}
                {format(endDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
              </span>
              {event.venue_name && (
                <span className="inline-flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {event.venue_name}
                    {event.venue_address ? ` - ${event.venue_address}` : ""}
                    {event.venue_city ? `, ${event.venue_city}` : ""}
                    {event.venue_state ? `, ${event.venue_state}` : ""}
                    {event.venue_zip ? ` - ${event.venue_zip}` : ""}
                  </span>
                </span>
              )}
              {event.max_capacity && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {event.max_capacity.toLocaleString("pt-BR")} pessoas
                </span>
              )}
            </div>

            {/* Section tabs - underline style */}
            <div className="flex border-b border-border gap-6">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "pb-3 text-sm font-medium transition-colors border-b-2",
                    activeSection === s.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Description section */}
            {activeSection === "description" && (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {event.description || "Sem descrição disponível."}
                </div>
                {event.minimum_age != null && event.minimum_age > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 rounded border border-border-strong text-xs font-bold">{event.minimum_age}+</span>
                    Classificação indicativa: {event.minimum_age} anos
                  </div>
                )}

                {/* Reviews section */}
                <EventReviews eventId={event.id} isPastEvent={isPastEvent} />

                {/* Produzido por */}
                {producer && (
                  <div className="border-t border-border pt-6 space-y-3">
                    <h3 className="font-display font-semibold text-foreground">Produzido por:</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {producer.organizer_logo_url ? (
                          <AvatarImage src={producer.organizer_logo_url} alt={producer.full_name || "Produtor"} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {(producer.full_name || "P").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{producer.full_name || "Produtor"}</p>
                        {producer.organizer_slug && (
                          <Link
                            to={`/organizador/${producer.organizer_slug}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                          >
                            Mais eventos do produtor <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tickets section */}
            {activeSection === "tickets" && (
              <div className="space-y-3">
                {loadingTiers ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                ) : tiers.length > 0 ? (
                  tiers.map((tier: any) => (
                    <TicketTierCard key={tier.id} id={tier.id} name={tier.name} description={tier.description}
                      price={tier.price ?? 0} originalPrice={tier.original_price}
                      quantityTotal={tier.quantity_total} quantitySold={tier.quantity_sold ?? 0}
                      quantityReserved={tier.quantity_reserved ?? 0}
                      minPerOrder={tier.min_per_order ?? 1} maxPerOrder={tier.max_per_order ?? 10}
                      tierType={tier.tier_type ?? "paid"} onAdd={handleAddToCart}
                      salesStartDate={tier.sales_start_date}
                      salesEndDate={tier.sales_end_date}
                      eventId={event.id} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm py-4">Nenhum ingresso disponível no momento.</p>
                )}

                {hasHiddenTiers && (
                  <div className="pt-2">
                    {!showUnlockInput ? (
                      <button onClick={() => setShowUnlockInput(true)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Lock className="h-3.5 w-3.5" /> Tenho um código de acesso
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <Input value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} placeholder="Insira o código" className="max-w-xs bg-secondary border-border-strong" maxLength={50}
                          onKeyDown={(e) => e.key === "Enter" && handleUnlock()} />
                        <Button size="sm" onClick={handleUnlock}>Desbloquear</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowUnlockInput(false); setUnlockCode(""); }}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                {products.length > 0 && (
                  <div className="pt-6">
                    <h3 className="font-display font-semibold text-foreground mb-3">Adicione ao seu ingresso</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((p: any) => (
                        <div key={p.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
                          <div className="flex items-start gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{p.name}</p>
                              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                              <p className="text-sm font-semibold text-foreground mt-1">{fmt(p.price)}</p>
                            </div>
                          </div>
                          {p.quantity_available != null && p.quantity_sold >= p.quantity_available ? (
                            <p className="text-xs text-destructive">Esgotado</p>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full" onClick={() => {
                              addItem({
                                tierId: `product-${p.id}`, eventId: event.id,
                                tierName: p.name, eventTitle: event.title,
                                eventSlug: event.slug, price: p.price, quantity: 1,
                                platformFeePercent: event.platform_fee_percent ?? 7,
                                maxPerOrder: p.max_per_order ?? 10,
                              });
                              toast({ title: "Produto adicionado ao carrinho" });
                            }}>
                              Adicionar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Venue section */}
            {activeSection === "venue" && (
              <div>
                {event.venue_name ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{event.venue_name}</p>
                    {event.venue_address && <p className="text-sm text-muted-foreground">{event.venue_address}</p>}
                    <p className="text-sm text-muted-foreground">
                      {[event.venue_city, event.venue_state].filter(Boolean).join(", ")}
                      {event.venue_zip ? ` — CEP ${event.venue_zip}` : ""}
                    </p>
                    {/* Google Maps embed */}
                    {event.venue_latitude && event.venue_longitude ? (
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-border mt-4">
                        <iframe
                          title="Mapa do local"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${event.venue_latitude},${event.venue_longitude}&z=15&output=embed`}
                        />
                      </div>
                    ) : event.venue_address ? (
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-border mt-4">
                        <iframe
                          title="Mapa do local"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent([event.venue_name, event.venue_address, event.venue_city].filter(Boolean).join(", "))}&output=embed`}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-secondary rounded-lg flex items-center justify-center text-sm text-muted-foreground border border-border mt-4">
                        Mapa indisponível
                      </div>
                    )}
                    {event.venue_name && (
                      <Link
                        to={`/eventos?local=${encodeURIComponent(event.venue_name)}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        Mais eventos neste local <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                ) : event.is_online ? (
                  <p className="text-sm text-muted-foreground">Este é um evento online.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Local a confirmar.</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar sticky CTA */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-20 space-y-4 p-5 rounded-xl border border-border bg-card">
              <h3 className="font-display font-semibold text-foreground">Ingressos</h3>
              {lowestPrice !== null ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    A partir de{" "}
                    <span className="text-foreground font-semibold">
                      {lowestPrice === 0 ? "Grátis" : fmt(lowestPrice)}
                    </span>
                  </p>
              <Button className="w-full" onClick={() => setActiveSection("tickets")}>
                    {lowestPrice === 0 ? "Inscrever-se" : "Ver ingressos"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Em breve</p>
              )}
              <ShareSheet url={window.location.href} title={event.title}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </Button>
              </ShareSheet>
            </div>
          </aside>
        </div>
      </div>

      {/* Cart CTA bar — shown after adding to cart */}
      {showCartCTA && (
        <div className="fixed bottom-[72px] lg:bottom-0 left-0 right-0 z-40 bg-primary text-primary-foreground p-4 animate-fade-in shadow-lg">
          <div className="container flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">✓ {lastAddedTierName} adicionado</p>
              <p className="text-xs opacity-80">{itemCount} {itemCount === 1 ? "item" : "itens"} no carrinho</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setShowCartCTA(false)} className="text-xs">
                Continuar
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/carrinho")} className="text-xs bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Finalizar compra
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA - above bottom nav */}
      {!showCartCTA && activeSection !== "tickets" && (
        <div className="lg:hidden fixed bottom-[72px] left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border p-4 safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="font-display font-bold text-foreground">
                {lowestPrice !== null ? (lowestPrice === 0 ? "Grátis" : fmt(lowestPrice)) : "—"}
              </p>
            </div>
            <Button onClick={() => setActiveSection("tickets")}>
              {lowestPrice === 0 ? "Inscrever-se" : "Ver ingressos"}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
