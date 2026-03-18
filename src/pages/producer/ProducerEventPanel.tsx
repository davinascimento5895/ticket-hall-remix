import { useState, Suspense } from "react";
import { EmbedSnippetGenerator } from "@/components/EmbedSnippetGenerator";
import { useParams, useNavigate, useLocation, Link, Outlet, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard, Ticket, Users, ScanLine, DollarSign, Mail, Tag, ChevronDown, Globe, MapPin, Calendar, Megaphone, Code, FileText, ClipboardList, Package, Settings, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProducerEventForm from "@/pages/producer/ProducerEventForm";

const EVENT_OPERATIONS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "" },
  { key: "tickets", label: "Ingressos", icon: Ticket, path: "/tickets" },
  { key: "orders", label: "Pedidos", icon: DollarSign, path: "/orders" },
  { key: "participants", label: "Participantes", icon: Users, path: "/participants" },
  { key: "guestlist", label: "Guest List", icon: Users, path: "/guestlist" },
  { key: "checkin", label: "Check-in", icon: ScanLine, path: "/checkin" },
  { key: "staff", label: "Equipe", icon: Users, path: "/staff" },
  { key: "financial", label: "Financeiro", icon: DollarSign, path: "/financial" },
  { key: "promoters", label: "Promoters", icon: Megaphone, path: "/promoters" },
  { key: "messages", label: "Mensagens", icon: Mail, path: "/messages" },
  { key: "coupons", label: "Cupons", icon: Tag, path: "/coupons" },
] as const;

const EDIT_SECTIONS = [
  { key: "info", label: "Informações", icon: FileText },
  { key: "venue", label: "Local", icon: MapPin },
  { key: "tickets", label: "Ingressos", icon: Ticket },
  { key: "form", label: "Formulário", icon: ClipboardList },
  { key: "products", label: "Produtos", icon: Package },
  { key: "settings", label: "Configurações", icon: Settings },
  { key: "review", label: "Revisão", icon: Eye },
] as const;

export default function ProducerEventPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const editorStep = searchParams.get("editorStep");
  const isInlineEditing = !!editorStep;
  const currentEditStepIndex = EDIT_SECTIONS.findIndex((section) => section.key === editorStep);
  const hasPreviousEditStep = currentEditStepIndex > 0;
  const hasNextEditStep = currentEditStepIndex >= 0 && currentEditStepIndex < EDIT_SECTIONS.length - 1;

  const { data: event, isLoading } = useQuery({
    queryKey: ["producer-event-panel", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, slug, start_date, end_date, is_online, venue_city, venue_name, status, cover_image_url")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const basePath = `/producer/events/${id}/panel`;
  const currentSuffix = location.pathname.replace(basePath, "");
  const activeTab = EVENT_OPERATIONS.find((t) => t.path === currentSuffix) || EVENT_OPERATIONS[0];

  const navigateToTab = (tab: typeof EVENT_OPERATIONS[number]) => {
    if (isInlineEditing) {
      const params = new URLSearchParams(searchParams);
      params.delete("editorStep");
      setSearchParams(params);
    }
    navigate(`${basePath}${tab.path}`);
    setMobileTabsOpen(false);
  };

  const navigateToEditStep = (stepKey: (typeof EDIT_SECTIONS)[number]["key"]) => {
    const params = new URLSearchParams(searchParams);
    params.set("editorStep", stepKey);
    setSearchParams(params);
    setMobileTabsOpen(false);
  };

  const closeInlineEditor = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("editorStep");
    setSearchParams(params);
  };

  const navigateEditByOffset = (offset: -1 | 1) => {
    if (currentEditStepIndex < 0) return;
    const nextStep = EDIT_SECTIONS[currentEditStepIndex + offset];
    if (!nextStep) return;
    navigateToEditStep(nextStep.key);
  };

  const navigateToReview = () => {
    navigateToEditStep("review");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Event Header */}
      <div className="mb-6 pb-4 border-b border-border">
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate">{event.title}</h1>
              <Badge variant={event.status === "published" ? "default" : "secondary"}>
                {event.status === "published" ? "Publicado" : event.status === "draft" ? "Rascunho" : event.status}
              </Badge>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEmbed(!showEmbed)}>
                  <Code className="h-3.5 w-3.5 mr-1" /> Embed
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
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

      {/* Embed Snippet */}
      {showEmbed && event && (
        <div className="mb-6">
          <EmbedSnippetGenerator eventSlug={(event as any).slug || id!} />
        </div>
      )}

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-1 gap-6 min-h-0 px-4">
        {/* Tab Navigation - Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col w-56 border-r border-border pr-6 overflow-y-auto -ml-4">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evento Atual</p>
          {EVENT_OPERATIONS.map((tab) => {
            const isActive = tab.key === activeTab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => navigateToTab(tab)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          <div className="mt-5 pt-4 border-t border-border/70">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editar Evento</p>
            {EDIT_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isEditSectionActive = editorStep === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => navigateToEditStep(section.key)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors",
                    isEditSectionActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}

            {isInlineEditing && (
              <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t border-border/60 px-4 pt-4 pb-4 mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasPreviousEditStep}
                    onClick={() => navigateEditByOffset(-1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    disabled={!hasNextEditStep}
                    onClick={() => navigateEditByOffset(1)}
                  >
                    Próximo
                  </Button>
                </div>
                <Button size="sm" variant="secondary" className="w-full" onClick={navigateToReview}>
                  Revisar
                </Button>
                <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={closeInlineEditor}>
                  Descartar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile && (
          <div className="lg:hidden w-full mb-4">
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
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Evento Atual</p>
                {EVENT_OPERATIONS.map((tab) => {
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
                <div className="my-1 border-t border-border" />
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Editar Evento</p>
                {EDIT_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isEditSectionActive = editorStep === section.key;
                  return (
                    <button
                      key={section.key}
                      onClick={() => navigateToEditStep(section.key)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                        isEditSectionActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Main Area */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-4">
          {isInlineEditing ? (
            <ProducerEventForm onCancel={closeInlineEditor} />
          ) : (
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[30vh]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            }>
              <Outlet />
            </Suspense>
          )}
        </div>
      </div>

    </div>
  );
}

