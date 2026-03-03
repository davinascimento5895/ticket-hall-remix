import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Share2, Users, ArrowLeft, Lock, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketTierCard } from "@/components/TicketTierCard";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getEventBySlug, getEventTiers } from "@/lib/api";
import { getEventProducts } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [unlockCode, setUnlockCode] = useState("");
  const [revealedCodes, setRevealedCodes] = useState<string[]>([]);
  const [showUnlockInput, setShowUnlockInput] = useState(false);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", slug],
    queryFn: () => getEventBySlug(slug!),
    enabled: !!slug,
  });

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

  const { addItem } = useCart();

  useRealtimeSubscription({
    table: "tickets",
    filter: event?.id ? `event_id=eq.${event.id}` : undefined,
    queryKey: ["event-tiers-all", event?.id || ""],
    enabled: !!event?.id,
  });

  // Filter tiers: show visible non-hidden + unlocked hidden tiers
  const tiers = allTiers?.filter((t: any) => {
    if (!t.is_visible) return false;
    if (t.is_hidden_by_default && t.unlock_code) {
      return revealedCodes.includes(t.unlock_code);
    }
    return !t.is_hidden_by_default;
  }) || [];

  const hasHiddenTiers = allTiers?.some((t: any) => t.is_hidden_by_default && t.is_visible) || false;

  const handleUnlock = () => {
    const code = unlockCode.trim();
    if (!code) return;
    const matched = allTiers?.some((t: any) => t.is_hidden_by_default && t.unlock_code === code);
    if (matched) {
      setRevealedCodes((prev) => [...prev, code]);
      setUnlockCode("");
      setShowUnlockInput(false);
      toast({ title: "Código válido!", description: "Ingressos exclusivos revelados." });
    } else {
      toast({ title: "Código inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
    }
  };

  const handleAddToCart = (tierId: string, quantity: number) => {
    const tier = allTiers?.find((t: any) => t.id === tierId);
    if (!tier || !event) return;
    addItem({
      tierId: tier.id, eventId: event.id, tierName: tier.name,
      eventTitle: event.title, eventSlug: event.slug,
      price: tier.price ?? 0, quantity,
      coverImageUrl: event.cover_image_url ?? undefined,
    });
    toast({ title: "Adicionado ao carrinho", description: `${quantity}x ${tier.name}` });
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

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16"><Skeleton className="w-full h-[340px]" />
          <div className="container py-8 space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-1/3" /></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">O evento que você procura não existe ou foi removido.</p>
          <Button asChild><Link to="/eventos">Ver todos os eventos</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  return (
    <div className="min-h-screen bg-background">
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
      <Navbar />

      {/* Cover */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-muted overflow-hidden">
        {event.cover_image_url ? <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container relative -mt-24 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <Link to="/eventos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Link>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{event.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}</span>
              {event.venue_name && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ""}</span>}
              {event.max_capacity && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{event.max_capacity.toLocaleString("pt-BR")} pessoas</span>}
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList>
                <TabsTrigger value="description">Descrição</TabsTrigger>
                <TabsTrigger value="tickets">Ingressos</TabsTrigger>
                {products.length > 0 && <TabsTrigger value="products">Produtos</TabsTrigger>}
                <TabsTrigger value="venue">Local</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="pt-4">
                <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
                  {event.description || "Sem descrição disponível."}
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="pt-4 space-y-3">
                {loadingTiers ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                ) : tiers.length > 0 ? (
                  tiers.map((tier: any) => (
                    <TicketTierCard key={tier.id} id={tier.id} name={tier.name} description={tier.description}
                      price={tier.price ?? 0} originalPrice={tier.original_price}
                      quantityTotal={tier.quantity_total} quantitySold={tier.quantity_sold ?? 0}
                      minPerOrder={tier.min_per_order ?? 1} maxPerOrder={tier.max_per_order ?? 10}
                      tierType={tier.tier_type ?? "paid"} onAdd={handleAddToCart} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum ingresso disponível no momento.</p>
                )}

                {/* Hidden tickets unlock */}
                {hasHiddenTiers && (
                  <div className="pt-2">
                    {!showUnlockInput ? (
                      <button onClick={() => setShowUnlockInput(true)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Lock className="h-3.5 w-3.5" /> Tenho um código de acesso
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <Input value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)} placeholder="Insira o código" className="max-w-xs" maxLength={50}
                          onKeyDown={(e) => e.key === "Enter" && handleUnlock()} />
                        <Button size="sm" onClick={handleUnlock}>Desbloquear</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowUnlockInput(false); setUnlockCode(""); }}>Cancelar</Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Products tab */}
              {products.length > 0 && (
                <TabsContent value="products" className="pt-4">
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
                            });
                            toast({ title: "Produto adicionado ao carrinho" });
                          }}>
                            Adicionar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="venue" className="pt-4">
                {event.venue_name ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{event.venue_name}</p>
                    {event.venue_address && <p className="text-sm text-muted-foreground">{event.venue_address}</p>}
                    <p className="text-sm text-muted-foreground">
                      {[event.venue_city, event.venue_state].filter(Boolean).join(", ")}
                      {event.venue_zip ? ` — CEP ${event.venue_zip}` : ""}
                    </p>
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground border border-border">Mapa em breve</div>
                  </div>
                ) : event.is_online ? (
                  <p className="text-sm text-muted-foreground">Este é um evento online.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Local a confirmar.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar sticky CTA */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-20 space-y-4 p-5 rounded-lg border border-border bg-card">
              <h3 className="font-display font-semibold text-foreground">Ingressos</h3>
              {tiers.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    A partir de{" "}
                    <span className="text-foreground font-semibold">
                      {Math.min(...tiers.map((t: any) => t.price ?? 0)) === 0 ? "Grátis" : fmt(Math.min(...tiers.map((t: any) => t.price ?? 0)))}
                    </span>
                  </p>
                  <Button className="w-full" onClick={() => document.querySelector('[data-value="tickets"]')?.dispatchEvent(new Event("click", { bubbles: true }))}>
                    Ver ingressos
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Em breve</p>
              )}
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> Compartilhar
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">A partir de</p>
            <p className="font-display font-bold text-foreground">
              {tiers.length > 0 ? (Math.min(...tiers.map((t: any) => t.price ?? 0)) === 0 ? "Grátis" : fmt(Math.min(...tiers.map((t: any) => t.price ?? 0)))) : "—"}
            </p>
          </div>
          <Button onClick={() => document.querySelector('[data-value="tickets"]')?.dispatchEvent(new Event("click", { bubbles: true }))}>
            Comprar ingresso
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
