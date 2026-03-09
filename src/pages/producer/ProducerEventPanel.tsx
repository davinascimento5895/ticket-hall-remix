import { useState, useEffect } from "react";
import { EmbedSnippetGenerator } from "@/components/EmbedSnippetGenerator";
import { useParams, useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard, Ticket, Users, ScanLine, DollarSign, Mail, Tag, ChevronDown, Globe, MapPin, Calendar, Megaphone, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "" },
  { key: "tickets", label: "Ingressos", icon: Ticket, path: "/tickets" },
  { key: "orders", label: "Pedidos", icon: DollarSign, path: "/orders" },
  { key: "participants", label: "Participantes", icon: Users, path: "/participants" },
  { key: "guestlist", label: "Guest List", icon: Users, path: "/guestlist" },
  { key: "checkin", label: "Check-in", icon: ScanLine, path: "/checkin" },
  { key: "financial", label: "Financeiro", icon: DollarSign, path: "/financial" },
  { key: "promoters", label: "Promoters", icon: Megaphone, path: "/promoters" },
  { key: "messages", label: "Mensagens", icon: Mail, path: "/messages" },
  { key: "coupons", label: "Cupons", icon: Tag, path: "/coupons" },
];

const [showEmbed, setShowEmbed] = useState(false);

export default function ProducerEventPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["producer-event-panel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("title, start_date, end_date, is_online, venue_city, venue_name, status, cover_image_url")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  // Determine active tab from URL
  const basePath = `/producer/events/${id}/panel`;
  const currentSuffix = location.pathname.replace(basePath, "");
  const activeTab = TABS.find((t) => t.path === currentSuffix) || TABS[0];

  const navigateToTab = (tab: typeof TABS[number]) => {
    navigate(`${basePath}${tab.path}`);
    setMobileTabsOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-0">
      {/* Event Header */}
      <div className="mb-6">
        <Link
          to="/producer/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos eventos
        </Link>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : event ? (
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate">{event.title}</h1>
              <Badge variant={event.status === "published" ? "default" : "secondary"}>
                {event.status === "published" ? "Publicado" : event.status === "draft" ? "Rascunho" : event.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {event.start_date ? formatDate(event.start_date) : "—"}
              </span>
              <span>—</span>
              <span>{event.end_date ? formatDate(event.end_date) : "—"}</span>
              <span className="flex items-center gap-1">
                {event.is_online ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {event.is_online ? "Evento online" : (event.venue_name || event.venue_city || "Local não definido")}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tab Navigation - Desktop */}
      <div className="hidden lg:flex items-center gap-1 border-b border-border mb-6 -mx-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => navigateToTab(tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Navigation - Mobile */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileTabsOpen(!mobileTabsOpen)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-muted text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <activeTab.icon className="h-4 w-4 text-primary" />
            <span>{activeTab.label}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileTabsOpen && "rotate-180")} />
        </button>
        {mobileTabsOpen && (
          <div className="mt-2 rounded-lg border border-border bg-background p-1.5 space-y-0.5">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => navigateToTab(tab)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
}
