import { useState, Suspense } from "react";
import { EmbedSnippetGenerator } from "@/components/EmbedSnippetGenerator";
import { useParams, useNavigate, useLocation, Link, Outlet, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard, Ticket, Users, ScanLine, DollarSign, Mail, Tag, Globe, MapPin, Calendar, Megaphone, Code, FileText, ClipboardList, Package, Settings, Eye, ArrowRight, CheckCircle2, Circle, Link as LinkIcon, PencilLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import ProducerEventForm from "@/pages/producer/ProducerEventForm";

const EVENT_OPERATIONS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "", hint: "Visão geral" },
  { key: "tickets", label: "Ingressos", icon: Ticket, path: "/tickets", hint: "Lotes e disponibilidade" },
  { key: "orders", label: "Pedidos", icon: DollarSign, path: "/orders", hint: "Transações" },
  { key: "participants", label: "Participantes", icon: Users, path: "/participants", hint: "Base de compradores" },
  { key: "guestlist", label: "Guest List", icon: Users, path: "/guestlist", hint: "Convidados" },
  { key: "checkin", label: "Check-in", icon: ScanLine, path: "/checkin", hint: "Acesso no evento" },
  { key: "staff", label: "Equipe", icon: Users, path: "/staff", hint: "Permissões" },
  { key: "financial", label: "Financeiro", icon: DollarSign, path: "/financial", hint: "Receita e repasses" },
  { key: "promoters", label: "Promoters", icon: Megaphone, path: "/promoters", hint: "Afiliados" },
  { key: "messages", label: "Mensagens", icon: Mail, path: "/messages", hint: "Comunicação" },
  { key: "coupons", label: "Cupons", icon: Tag, path: "/coupons", hint: "Descontos" },
] as const;

const EDIT_SECTIONS = [
  { key: "info", label: "Informações", icon: FileText, hint: "Identidade do evento" },
  { key: "venue", label: "Local", icon: MapPin, hint: "Online ou presencial" },
  { key: "tickets", label: "Ingressos", icon: Ticket, hint: "Tipos e lotes" },
  { key: "form", label: "Formulário", icon: ClipboardList, hint: "Perguntas de checkout" },
  { key: "products", label: "Produtos", icon: Package, hint: "Upsell e catálogo" },
  { key: "settings", label: "Configurações", icon: Settings, hint: "Recursos avançados" },
  { key: "review", label: "Revisão", icon: Eye, hint: "Conferência final" },
] as const;

export default function ProducerEventPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
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
  const activeMode = isInlineEditing ? "edit" : "operations";
  const activeEditSection = EDIT_SECTIONS.find((section) => section.key === editorStep) || EDIT_SECTIONS[0];
  const publicEventUrl = event?.slug ? `${window.location.origin}/eventos/${event.slug}` : null;
  const readinessChecklist = [
    { label: "Nome do evento", done: !!event?.title?.trim() },
    { label: "Descrição preenchida", done: !!event?.description?.trim() },
    { label: "Data de início", done: !!event?.start_date },
    { label: event?.is_online ? "Plataforma definida" : "Local definido", done: !!(event?.is_online || event?.venue_name || event?.venue_city) },
    { label: "Imagem de capa", done: !!event?.cover_image_url },
    { label: "Evento publicado", done: event?.status === "published" },
  ];
  const readinessDone = readinessChecklist.filter((item) => item.done).length;
  const readinessPercent = Math.round((readinessDone / readinessChecklist.length) * 100);

  const navigateToTab = (tab: typeof EVENT_OPERATIONS[number]) => {
    if (isInlineEditing) {
      const params = new URLSearchParams(searchParams);
      params.delete("editorStep");
      setSearchParams(params);
    }
    navigate(`${basePath}${tab.path}`);
  };

  const navigateToEditStep = (stepKey: (typeof EDIT_SECTIONS)[number]["key"]) => {
    const params = new URLSearchParams(searchParams);
    params.set("editorStep", stepKey);
    setSearchParams(params);
  };

  const enterEditMode = () => {
    navigateToEditStep(editorStep && EDIT_SECTIONS.some((section) => section.key === editorStep)
      ? (editorStep as (typeof EDIT_SECTIONS)[number]["key"])
      : "info");
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

  const openPublicPage = () => {
    if (!publicEventUrl) {
      toast({ title: "URL indisponível", description: "Defina um slug para abrir a página pública.", variant: "destructive" });
      return;
    }
    window.open(publicEventUrl, "_blank", "noopener,noreferrer");
  };

  const copyPublicLink = async () => {
    if (!publicEventUrl) {
      toast({ title: "URL indisponível", description: "Defina um slug para compartilhar o evento.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(publicEventUrl);
      toast({ title: "Link copiado", description: "URL pública copiada para a área de transferência." });
    } catch {
      toast({ title: "Falha ao copiar", description: "Não foi possível copiar o link agora.", variant: "destructive" });
    }
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
        <div className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/70 pr-5 overflow-y-auto -ml-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Navegação do evento</CardTitle>
              <CardDescription>Alterne entre operação e edição estrutural do evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={activeMode === "operations" ? "default" : "outline"}
                  onClick={() => closeInlineEditor()}
                  className="justify-start"
                >
                  Evento atual
                </Button>
                <Button
                  size="sm"
                  variant={activeMode === "edit" ? "default" : "outline"}
                  onClick={enterEditMode}
                  className="justify-start"
                >
                  Editar evento
                </Button>
              </div>

              <div className="space-y-1.5">
                {(activeMode === "operations" ? EVENT_OPERATIONS : EDIT_SECTIONS).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMode === "operations" ? activeTab.key === item.key : editorStep === item.key;

                  return (
                    <button
                      key={item.key}
                      title={item.hint}
                      onClick={() => activeMode === "operations" ? navigateToTab(item as (typeof EVENT_OPERATIONS)[number]) : navigateToEditStep(item.key as (typeof EDIT_SECTIONS)[number]["key"])}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isInlineEditing && (
                <div className="border-t border-border/70 pt-3 space-y-2">
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
                    Revisar edição
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={closeInlineEditor}>
                    Voltar para operação
                  </Button>
                </div>
              )}

              <div className="border-t border-border/70 pt-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Checklist de prontidão</p>
                <Progress value={readinessPercent} className="h-2" />
                <div className="space-y-1.5">
                  {readinessChecklist.slice(0, 4).map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Circle className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{readinessDone}/{readinessChecklist.length} itens completos</p>
              </div>

              <div className="border-t border-border/70 pt-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ações rápidas</p>
                <Button size="sm" variant="outline" className="w-full justify-start" onClick={openPublicPage}>
                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Pré-visualizar página pública
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start" onClick={copyPublicLink}>
                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Copiar link de divulgação
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start" onClick={enterEditMode}>
                  <PencilLine className="h-3.5 w-3.5 mr-1.5" /> Abrir edição guiada
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile && (
          <div className="lg:hidden w-full mb-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={activeMode === "operations" ? "default" : "outline"}
                  onClick={closeInlineEditor}
                >
                  Evento atual
                </Button>
                <Button
                  size="sm"
                  variant={activeMode === "edit" ? "default" : "outline"}
                  onClick={enterEditMode}
                >
                  Editar evento
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(activeMode === "operations" ? EVENT_OPERATIONS : EDIT_SECTIONS).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMode === "operations" ? activeTab.key === item.key : editorStep === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => activeMode === "operations" ? navigateToTab(item as (typeof EVENT_OPERATIONS)[number]) : navigateToEditStep(item.key as (typeof EDIT_SECTIONS)[number]["key"])}
                      className={cn(
                        "shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isInlineEditing && (
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Editando etapa: <span className="font-medium text-foreground">{activeEditSection.label}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={!hasPreviousEditStep} onClick={() => navigateEditByOffset(-1)}>
                      Anterior
                    </Button>
                    <Button size="sm" disabled={!hasNextEditStep} onClick={() => navigateEditByOffset(1)}>
                      Próximo
                    </Button>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full" onClick={navigateToReview}>
                    Revisar edição
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content - Main Area */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-2 lg:pr-4">
          {isInlineEditing && (
            <div className="mb-4 rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Modo de edição</p>
                  <p className="text-sm font-semibold text-foreground">{activeEditSection.label}</p>
                  <p className="text-xs text-muted-foreground">{activeEditSection.hint}</p>
                </div>
                <Button variant="outline" size="sm" onClick={closeInlineEditor} className="gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Voltar para operação
                </Button>
              </div>
            </div>
          )}

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

