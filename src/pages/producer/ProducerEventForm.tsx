import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, ArrowLeft, ArrowRight, Upload, MapPin, Globe, Video, Link2, Image as ImageIcon, Calendar, Ticket, FileText, Settings, Eye, ChevronDown, ChevronUp, Clock, Users, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { createEvent, updateEvent, createTicketTier, deleteTicketTier } from "@/lib/api-producer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckoutQuestionsBuilder } from "@/components/producer/CheckoutQuestionsBuilder";
import { TaxesFeesManager } from "@/components/producer/TaxesFeesManager";
import { CapacityGroupsManager } from "@/components/producer/CapacityGroupsManager";
import { EventProductsManager } from "@/components/producer/EventProductsManager";
import { getCapacityGroups } from "@/lib/api-checkout";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { useIBGEStates, useIBGECities } from "@/hooks/useIBGELocations";
import { fetchAddress } from "@/lib/cep";
import { generateUniqueSlug } from "@/lib/slug";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "@/components/producer/ImageCropModal";

const STEPS = [
  { key: "type", label: "Tipo", icon: Globe },
  { key: "info", label: "Informações", icon: FileText },
  { key: "venue", label: "Local", icon: MapPin },
  { key: "tickets", label: "Ingressos", icon: Ticket },
  { key: "form", label: "Formulário", icon: FileText },
  { key: "products", label: "Produtos", icon: Settings },
  { key: "settings", label: "Configurações", icon: Settings },
  { key: "review", label: "Revisão", icon: Eye },
];

const SECTOR_COLORS = [
  "#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE",
  "#805AD5", "#D53F8C", "#2B6CB0", "#2C7A7B", "#9B2C2C",
];

const ONLINE_PLATFORMS = [
  { id: "external", name: "Outras plataformas", description: "Youtube, Instagram, WhatsApp, Google Meet, etc.", icon: Link2 },
  { id: "zoom", name: "Zoom", description: "Videoconferência (link externo)", icon: Video },
];

interface TierDraft {
  id?: string;
  name: string;
  tier_type: string;
  price: number;
  quantity_total: number;
  description: string;
  min_per_order: number;
  max_per_order: number;
  is_transferable: boolean;
  capacity_group_id: string | null;
  is_hidden_by_default: boolean;
  unlock_code: string;
  sector_color: string;
  sale_start_date: string;
  sale_end_date: string;
  who_can_buy: string;
  is_visible: boolean;
  is_half_price: boolean;
}

export default function ProducerEventForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(isEdit ? 1 : 0);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", slug: "", description: "", category: "shows",
    start_date: "", end_date: "", doors_open_time: "",
    venue_name: "", venue_address: "", venue_city: "", venue_state: "", venue_zip: "",
    venue_number: "", venue_complement: "", venue_neighborhood: "",
    is_online: false, online_url: "", online_platform: "external",
    minimum_age: 0, max_capacity: 0, cover_image_url: "", status: "draft",
    has_seat_map: false, has_virtual_queue: false, queue_capacity: 0,
    has_certificates: false, has_insurance_option: false, insurance_price: 0,
    visibility: "public",
  });

  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [seatMapFile, setSeatMapFile] = useState<File | null>(null);
  const [seatMapImageUrl, setSeatMapImageUrl] = useState<string>("");
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [tierDraft, setTierDraft] = useState<TierDraft>(emptyTier());
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");

  const { data: capacityGroups = [] } = useQuery({
    queryKey: ["capacity-groups", id],
    queryFn: () => getCapacityGroups(id!),
    enabled: isEdit,
  });

  useQuery({
    queryKey: ["edit-event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      if (data) {
        setForm({
          title: data.title || "", slug: data.slug || "", description: data.description || "",
          category: data.category || "shows",
          start_date: data.start_date?.slice(0, 16) || "", end_date: data.end_date?.slice(0, 16) || "",
          doors_open_time: data.doors_open_time?.slice(0, 16) || "",
          venue_name: data.venue_name || "", venue_address: data.venue_address || "",
          venue_city: data.venue_city || "", venue_state: data.venue_state || "",
          venue_zip: data.venue_zip || "", venue_number: "", venue_complement: "", venue_neighborhood: "",
          is_online: data.is_online || false, online_url: data.online_url || "", online_platform: "external",
          minimum_age: data.minimum_age || 0, max_capacity: data.max_capacity || 0,
          cover_image_url: data.cover_image_url || "", status: data.status || "draft",
          has_seat_map: data.has_seat_map || false,
          has_virtual_queue: data.has_virtual_queue || false,
          queue_capacity: data.queue_capacity || 0,
          has_certificates: data.has_certificates || false,
          has_insurance_option: data.has_insurance_option || false,
          insurance_price: data.insurance_price || 0,
          visibility: "public",
        });
        if (data.cover_image_url) setCoverPreview(data.cover_image_url);
        const smc = data.seat_map_config as any;
        if (smc?.imageUrl) setSeatMapImageUrl(smc.imageUrl);
      }
      return data;
    },
    enabled: isEdit,
  });

  useQuery({
    queryKey: ["edit-event-tiers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ticket_tiers").select("*").eq("event_id", id).order("sort_order");
      if (error) throw error;
      if (data) {
        setTiers(data.map((t, idx) => ({
          id: t.id, name: t.name, tier_type: t.tier_type || "paid",
          price: t.price || 0, quantity_total: t.quantity_total,
          description: t.description || "",
          min_per_order: t.min_per_order || 1, max_per_order: t.max_per_order || 10,
          is_transferable: t.is_transferable ?? true,
          capacity_group_id: (t as any).capacity_group_id || null,
          is_hidden_by_default: (t as any).is_hidden_by_default ?? false,
          unlock_code: (t as any).unlock_code || "",
          sector_color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
          sale_start_date: t.sale_start_date?.slice(0, 16) || "",
          sale_end_date: t.sale_end_date?.slice(0, 16) || "",
          who_can_buy: "public",
          is_visible: t.is_visible ?? true,
          is_half_price: false,
        })));
      }
      return data;
    },
    enabled: isEdit,
  });

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const updateField = (field: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && !isEdit) updated.slug = generateSlug(value);
      return updated;
    });
  };

  function emptyTier(): TierDraft {
    return {
      name: "", tier_type: "paid", price: 0, quantity_total: 100, description: "",
      min_per_order: 1, max_per_order: 5, is_transferable: true,
      capacity_group_id: null, is_hidden_by_default: false, unlock_code: "",
      sector_color: SECTOR_COLORS[tiers.length % SECTOR_COLORS.length],
      sale_start_date: "", sale_end_date: "",
      who_can_buy: "public", is_visible: true, is_half_price: false,
    };
  }

  const openNewTierDialog = (type: string) => {
    setEditingTierIndex(null);
    setTierDraft({ ...emptyTier(), tier_type: type });
    setTierDialogOpen(true);
  };

  const openEditTierDialog = (index: number) => {
    setEditingTierIndex(index);
    setTierDraft({ ...tiers[index] });
    setTierDialogOpen(true);
  };

  const saveTierFromDialog = () => {
    if (!tierDraft.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do ingresso.", variant: "destructive" });
      return;
    }
    if (editingTierIndex !== null) {
      setTiers((prev) => prev.map((t, i) => (i === editingTierIndex ? { ...tierDraft } : t)));
    } else {
      setTiers((prev) => [...prev, { ...tierDraft }]);
    }
    setTierDialogOpen(false);
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setCropModalOpen(true);
    }
    // Reset input so re-selecting the same file works
    e.target.value = "";
  };

  const handleCropDone = (croppedFile: File) => {
    setCoverFile(croppedFile);
    setCoverPreview(URL.createObjectURL(croppedFile));
  };

  const handleUploadCover = async () => {
    if (!coverFile || !user) return form.cover_image_url;
    const ext = coverFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, coverFile);
    if (error) throw error;
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async (publish = false) => {
    if (!user) return;
    if (publish && !user) {
      toast({ title: "Erro", description: "Você precisa estar autenticado para publicar eventos.", variant: "destructive" });
      return;
    }
    try {
      let coverUrl = form.cover_image_url;
      if (coverFile) coverUrl = await handleUploadCover();

      // Ensure unique slug for new events
      let finalSlug = form.slug;
      if (!isEdit) {
        finalSlug = await generateUniqueSlug(form.title);
      }

      let finalSeatMapUrl = seatMapImageUrl;
      if (seatMapFile && user) {
        const ext = seatMapFile.name.split(".").pop();
        const path = `${user.id}/seatmap-${Date.now()}.${ext}`;
        const { error: smErr } = await supabase.storage.from("event-images").upload(path, seatMapFile);
        if (smErr) throw smErr;
        const { data: smData } = supabase.storage.from("event-images").getPublicUrl(path);
        finalSeatMapUrl = smData.publicUrl;
      }

      const seatMapConfig = form.has_seat_map ? {
        imageUrl: finalSeatMapUrl || null,
        tierColors: Object.fromEntries(
          tiers.filter(t => t.sector_color).map(t => [t.name, t.sector_color])
        ),
      } : null;

      let fullAddress = form.venue_address;
      if (form.venue_number) fullAddress += `, ${form.venue_number}`;
      if (form.venue_complement) fullAddress += ` - ${form.venue_complement}`;
      if (form.venue_neighborhood) fullAddress += `, ${form.venue_neighborhood}`;

      const eventData: any = {
        title: form.title, slug: finalSlug, description: form.description,
        category: form.category, venue_name: form.venue_name,
        venue_address: fullAddress, venue_city: form.venue_city,
        venue_state: form.venue_state, venue_zip: form.venue_zip,
        is_online: form.is_online, online_url: form.online_url,
        minimum_age: form.minimum_age, max_capacity: form.max_capacity,
        cover_image_url: coverUrl, has_seat_map: form.has_seat_map,
        seat_map_config: seatMapConfig, has_virtual_queue: form.has_virtual_queue,
        queue_capacity: form.queue_capacity, has_certificates: form.has_certificates,
        has_insurance_option: form.has_insurance_option, insurance_price: form.insurance_price,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        doors_open_time: form.doors_open_time ? new Date(form.doors_open_time).toISOString() : null,
        status: publish ? "published" : form.status,
      };

      let eventId = id;
      if (isEdit) {
        await updateEvent(id!, eventData);
      } else {
        eventData.producer_id = user.id;
        const created = await createEvent(eventData);
        eventId = created.id;
      }

      // Delete tiers that were removed in the UI
      if (isEdit && eventId) {
        const { data: existingTiers } = await supabase
          .from("ticket_tiers")
          .select("id")
          .eq("event_id", eventId);
        const currentTierIds = tiers.filter((t) => t.id).map((t) => t.id);
        const toDelete = (existingTiers || []).filter((t) => !currentTierIds.includes(t.id));
        for (const t of toDelete) {
          await supabase.from("ticket_tiers").delete().eq("id", t.id);
        }
      }

      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const tierData = {
          name: tier.name, tier_type: tier.tier_type, price: tier.price,
          quantity_total: tier.quantity_total, description: tier.description,
          min_per_order: tier.min_per_order, max_per_order: tier.max_per_order,
          is_transferable: tier.is_transferable, sort_order: i,
          capacity_group_id: tier.capacity_group_id || null,
          is_hidden_by_default: tier.is_hidden_by_default,
          unlock_code: tier.unlock_code || null,
          sale_start_date: tier.sale_start_date ? new Date(tier.sale_start_date).toISOString() : null,
          sale_end_date: tier.sale_end_date ? new Date(tier.sale_end_date).toISOString() : null,
          is_visible: tier.is_visible,
        };
        if (tier.id) {
          await supabase.from("ticket_tiers").update(tierData).eq("id", tier.id);
        } else {
          await createTicketTier({ event_id: eventId!, ...tierData });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["producer-events"] });
      toast({ title: publish ? "Evento publicado!" : "Evento salvo!" });
      navigate("/producer/events");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const visibleSteps = STEPS.filter((_, i) => !(i === 0 && isEdit));
  const currentStepData = STEPS[step];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar Steps - Desktop */}
      <nav className="hidden lg:flex flex-col w-56 shrink-0">
        <div className="sticky top-24 space-y-1">
          <h2 className="font-display text-lg font-bold mb-4">
            {isEdit ? "Editar Evento" : "Criar Evento"}
          </h2>
          {visibleSteps.map((s, vi) => {
            const realIndex = STEPS.indexOf(s);
            const Icon = s.icon;
            const isActive = realIndex === step;
            const isDone = realIndex < step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(realIndex)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && !isActive && "text-primary",
                  !isActive && !isDone && "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs shrink-0",
                  isActive && "bg-primary-foreground/20",
                  isDone && !isActive && "bg-primary/15",
                  !isActive && !isDone && "bg-muted"
                )}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileStepsOpen(!mobileStepsOpen)}
          className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-muted text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
              {step + 1}
            </span>
            <span>Passo {step + 1} de {visibleSteps.length}: <span className="font-semibold">{currentStepData?.label}</span></span>
          </div>
          {mobileStepsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {mobileStepsOpen && (
          <div className="mt-2 rounded-lg border border-border bg-background p-2 space-y-0.5">
            {visibleSteps.map((s) => {
              const realIndex = STEPS.indexOf(s);
              const isActive = realIndex === step;
              const isDone = realIndex < step;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => { setStep(realIndex); setMobileStepsOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isDone && !isActive && "text-primary",
                    !isActive && !isDone && "text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl space-y-6 pb-8">
        {/* Step 0: Event Type Selection */}
        {step === 0 && !isEdit && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Qual é o formato do seu evento?</CardTitle>
                <CardDescription>Escolha se o evento será presencial ou online</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={form.is_online ? "online" : "presencial"}
                  onValueChange={(v) => updateField("is_online", v === "online")}
                  className="grid gap-4"
                >
                  <label className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    !form.is_online ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    <RadioGroupItem value="presencial" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Evento Presencial</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Evento com local físico definido. Ideal para shows, festas, palestras, conferências e encontros.
                      </p>
                    </div>
                  </label>

                  <label className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    form.is_online ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    <RadioGroupItem value="online" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Evento Online</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Evento virtual via transmissão. Ideal para webinars, cursos, lives e conferências online.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            {form.is_online && (
              <Card>
                <CardHeader>
                  <CardTitle>Plataforma de transmissão</CardTitle>
                  <CardDescription>Onde o evento online vai acontecer?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={form.online_platform}
                    onValueChange={(v) => updateField("online_platform", v)}
                    className="grid gap-3"
                  >
                    {ONLINE_PLATFORMS.map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          form.online_platform === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={p.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{p.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações básicas
                </CardTitle>
                <CardDescription>Adicione as principais informações do evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Nome do evento *</Label>
                  <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Nome do seu evento" maxLength={100} />
                  <p className="text-xs text-muted-foreground mt-1">{100 - form.title.length} caracteres restantes</p>
                </div>

                <div>
                  <Label>URL personalizada</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">tickethall.com/eventos/</span>
                    <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="flex-1" />
                  </div>
                </div>

                <div>
                  <Label>Imagem de divulgação</Label>
                  <div className={cn(
                    "mt-2 border-2 border-dashed rounded-xl transition-colors",
                    coverPreview ? "border-primary/50" : "border-border hover:border-primary/50"
                  )}>
                    {coverPreview ? (
                      <div className="relative">
                        <img src={coverPreview} alt="Capa do evento" className="w-full aspect-[1600/838] object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                            <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                            <Upload className="h-4 w-4" />Trocar imagem
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-10 cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Clique ou arraste a imagem aqui</p>
                        <div className="mt-2 px-3 py-1.5 rounded-md bg-muted border border-border">
                          <p className="text-xs font-mono font-semibold text-foreground text-center">1600 × 838 px</p>
                          <p className="text-[10px] text-muted-foreground text-center">proporção ~16:9</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center px-4">
                          JPEG, PNG ou WebP • Máx. 5MB<br />
                          A imagem será ajustada automaticamente no próximo passo.
                        </p>
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Descrição do evento</Label>
                  <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={6} placeholder="Conte todos os detalhes do seu evento, como a programação e os diferenciais da sua produção..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Data e horário
                </CardTitle>
                <CardDescription>Informe aos participantes quando seu evento vai acontecer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Data e hora de início *</Label>
                    <Input type="datetime-local" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} />
                  </div>
                  <div>
                    <Label>Data e hora de término *</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => updateField("end_date", e.target.value)} />
                  </div>
                </div>
                {!form.is_online && (
                  <div>
                    <Label>Abertura dos portões (opcional)</Label>
                    <Input type="datetime-local" value={form.doors_open_time} onChange={(e) => updateField("doors_open_time", e.target.value)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Venue */}
        {step === 2 && <VenueStep form={form} updateField={updateField} />}

        {/* Step 3: Tickets */}
        {step === 3 && (
          <div className="space-y-6">
            {isEdit && <CapacityGroupsManager eventId={id!} />}
            {isEdit && <TaxesFeesManager eventId={id!} />}

            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Ingressos
                  </CardTitle>
                  <CardDescription>Configure os tipos de ingresso do seu evento</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tiers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">Nenhum ingresso criado ainda.</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" onClick={() => openNewTierDialog("free")} className="gap-1">
                        <Plus className="h-4 w-4" />Ingresso gratuito
                      </Button>
                      <Button onClick={() => openNewTierDialog("paid")} className="gap-1">
                        <Plus className="h-4 w-4" />Ingresso pago
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {tiers.map((tier, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openEditTierDialog(i)}>
                        <div className="flex items-center gap-3 min-w-0">
                          {!tier.is_visible && <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{tier.name || `Lote ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {tier.tier_type === "free" ? "Gratuito" : `R$ ${tier.price.toFixed(2).replace(".", ",")}`}
                              {" · "}{tier.quantity_total} un.
                              {tier.is_half_price && " · Meia-entrada"}
                            </p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeTier(i); }} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={() => openNewTierDialog("free")} className="gap-1">
                        <Plus className="h-4 w-4" />Gratuito
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openNewTierDialog("paid")} className="gap-1">
                        <Plus className="h-4 w-4" />Pago
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openNewTierDialog("donation")} className="gap-1">
                        <Plus className="h-4 w-4" />Doação
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tier Dialog */}
            <TierDialog
              open={tierDialogOpen}
              onOpenChange={setTierDialogOpen}
              tier={tierDraft}
              setTier={setTierDraft}
              onSave={saveTierFromDialog}
              isEdit={editingTierIndex !== null}
              capacityGroups={capacityGroups}
              hasSeatMap={form.has_seat_map}
            />
          </div>
        )}

        {/* Step 4: Checkout Questions */}
        {step === 4 && (
          isEdit ? <CheckoutQuestionsBuilder eventId={id!} /> : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Salve o evento primeiro para configurar o formulário de participante.</p>
              </CardContent>
            </Card>
          )
        )}

        {/* Step 5: Products */}
        {step === 5 && (
          isEdit ? <EventProductsManager eventId={id!} /> : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Salve o evento primeiro para adicionar produtos.</p>
              </CardContent>
            </Card>
          )
        )}

        {/* Step 6: Settings */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Idade mínima</Label>
                  <Input type="number" min={0} value={form.minimum_age} onChange={(e) => updateField("minimum_age", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Capacidade máxima</Label>
                  <Input type="number" min={0} value={form.max_capacity} onChange={(e) => updateField("max_capacity", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm text-foreground">Funcionalidades avançadas</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Mapa de setores</Label>
                  <p className="text-xs text-muted-foreground">Upload de imagem do mapa com setores coloridos</p>
                </div>
                <Switch checked={form.has_seat_map} onCheckedChange={(v) => updateField("has_seat_map", v)} />
              </div>
              {form.has_seat_map && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <div>
                    <Label className="text-xs">Imagem do mapa de setores</Label>
                    <p className="text-xs text-muted-foreground mb-1">Envie uma imagem (PNG/JPG) com o layout do evento.</p>
                    {seatMapImageUrl && <img src={seatMapImageUrl} alt="Mapa" className="w-full max-h-48 object-contain rounded-lg border border-border mb-2 bg-muted/30" />}
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setSeatMapFile(file); setSeatMapImageUrl(URL.createObjectURL(file)); }
                    }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Fila virtual</Label>
                  <p className="text-xs text-muted-foreground">Ativa fila de espera para alta demanda</p>
                </div>
                <Switch checked={form.has_virtual_queue} onCheckedChange={(v) => updateField("has_virtual_queue", v)} />
              </div>
              {form.has_virtual_queue && (
                <div>
                  <Label className="text-xs">Capacidade da fila</Label>
                  <Input type="number" min={0} value={form.queue_capacity} onChange={(e) => updateField("queue_capacity", parseInt(e.target.value) || 0)} />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Certificados</Label>
                  <p className="text-xs text-muted-foreground">Emitir certificados de participação</p>
                </div>
                <Switch checked={form.has_certificates} onCheckedChange={(v) => updateField("has_certificates", v)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Seguro de ingresso</Label>
                  <p className="text-xs text-muted-foreground">Oferecer seguro opcional na compra</p>
                </div>
                <Switch checked={form.has_insurance_option} onCheckedChange={(v) => updateField("has_insurance_option", v)} />
              </div>
              {form.has_insurance_option && (
                <div>
                  <Label className="text-xs">Preço do seguro (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.insurance_price} onChange={(e) => updateField("insurance_price", parseFloat(e.target.value) || 0)} />
                </div>
              )}

              <Separator className="my-2" />

              <div>
                <Label className="text-sm">Visibilidade do evento</Label>
                <RadioGroup value={form.visibility} onValueChange={(v) => updateField("visibility", v)} className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="public" />
                    <span className="text-sm">Público</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="private" />
                    <span className="text-sm">Privado</span>
                  </label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.visibility === "public" ? "Evento visível para todos na plataforma" : "Evento acessível apenas com link direto"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Revisão</CardTitle>
              <CardDescription>Confira os dados antes de publicar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverPreview && <img src={coverPreview} alt="Capa" className="w-full aspect-[16/9] object-cover rounded-lg" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Título:</span>
                <span className="text-foreground font-medium">{form.title}</span>
                <span className="text-muted-foreground">Tipo:</span>
                <span className="text-foreground">{form.is_online ? "Online" : "Presencial"}</span>
                <span className="text-muted-foreground">Categoria:</span>
                <span className="text-foreground">{EVENT_CATEGORIES.find((c) => c.value === form.category)?.label}</span>
                <span className="text-muted-foreground">Início:</span>
                <span className="text-foreground">{form.start_date ? new Date(form.start_date).toLocaleString("pt-BR") : "—"}</span>
                <span className="text-muted-foreground">Término:</span>
                <span className="text-foreground">{form.end_date ? new Date(form.end_date).toLocaleString("pt-BR") : "—"}</span>
                <span className="text-muted-foreground">Local:</span>
                <span className="text-foreground">{form.is_online ? (form.online_url || "URL não informada") : (form.venue_name || "—")}</span>
                <span className="text-muted-foreground">Ingressos:</span>
                <span className="text-foreground">{tiers.length} tipo(s)</span>
              </div>

              {tiers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-foreground">Ingressos:</p>
                  {tiers.map((t, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-lg bg-secondary text-sm">
                      <span className="font-medium">{t.name}{!t.is_visible ? " 🔒" : ""}</span>
                      <span className="text-muted-foreground">
                        {t.tier_type === "free" ? "Grátis" : `R$ ${t.price.toFixed(2).replace(".", ",")}`} · {t.quantity_total} un.
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />
              <p className="text-xs text-muted-foreground">
                Ao publicar este evento, declaro estar de acordo com os Termos de Uso e Política de Privacidade da plataforma.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" disabled={step === 0 || (step === 1 && isEdit)} onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
          <div className="flex gap-2">
            {step === STEPS.length - 1 ? (
              <>
                <Button variant="outline" onClick={() => handleSave(false)}>Salvar rascunho</Button>
                <Button onClick={() => handleSave(true)}>Publicar evento</Button>
              </>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-1">
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop Modal — always mounted regardless of step */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={cropImageSrc}
        onCropDone={handleCropDone}
      />
    </div>
  );
}

/* ── Tier Dialog ── */
function TierDialog({
  open, onOpenChange, tier, setTier, onSave, isEdit, capacityGroups, hasSeatMap,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tier: TierDraft;
  setTier: React.Dispatch<React.SetStateAction<TierDraft>>;
  onSave: () => void;
  isEdit: boolean;
  capacityGroups: any[];
  hasSeatMap: boolean;
}) {
  const update = (field: string, value: any) => setTier((prev) => ({ ...prev, [field]: value }));
  const isPaid = tier.tier_type === "paid";
  const isFree = tier.tier_type === "free";
  const title = isEdit ? "Editar ingresso" : `Criar ingresso ${isFree ? "gratuito" : isPaid ? "pago" : "doação"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isPaid && (
          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
            A taxa de serviço é repassada ao comprador, sendo exibida junto com o valor do ingresso.
          </div>
        )}

        <div className="space-y-5 mt-2">
          {/* About the ticket */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Sobre o ingresso *</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs">Título do ingresso *</Label>
                <Input value={tier.name} onChange={(e) => update("name", e.target.value)} placeholder="VIP, Meia-Entrada, etc." maxLength={45} />
                <p className="text-xs text-muted-foreground mt-0.5">{45 - tier.name.length} caracteres restantes</p>
              </div>
              <div>
                <Label className="text-xs">Quantidade *</Label>
                <Input type="number" min={1} value={tier.quantity_total} onChange={(e) => update("quantity_total", parseInt(e.target.value) || 1)} placeholder="Ex. 100" />
              </div>
              <div>
                <Label className="text-xs">Valor a receber *</Label>
                {isFree ? (
                  <Input disabled value="Grátis" className="bg-muted" />
                ) : (
                  <Input type="number" min={0} step={0.01} value={tier.price || ""} onChange={(e) => update("price", parseFloat(e.target.value) || 0)} placeholder="R$" />
                )}
              </div>
            </div>
            {isPaid && (
              <div className="flex items-center gap-2 mt-3">
                <Checkbox checked={tier.is_half_price} onCheckedChange={(v) => update("is_half_price", !!v)} />
                <Label className="text-xs">Criar meia-entrada para este ingresso</Label>
              </div>
            )}
          </div>

          <Separator />

          {/* Sale period */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Quando o ingresso será vendido *</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Início das vendas</Label>
                <Input type="datetime-local" value={tier.sale_start_date} onChange={(e) => update("sale_start_date", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-0.5">Horário de Brasília</p>
              </div>
              <div>
                <Label className="text-xs">Término das vendas</Label>
                <Input type="datetime-local" value={tier.sale_end_date} onChange={(e) => update("sale_end_date", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-0.5">Horário de Brasília</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Who can buy */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Quem pode comprar *</h4>
            <RadioGroup value={tier.who_can_buy} onValueChange={(v) => update("who_can_buy", v)} className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="public" />
                <span className="text-sm">Para todo o público</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="guests" />
                <span className="text-sm">Restrito a convidados</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="manual" />
                <span className="text-sm">Para ser adicionado manualmente</span>
              </label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quantity per order & description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">Quantidade por compra</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Mínima *</Label>
                  <Input type="number" min={1} value={tier.min_per_order} onChange={(e) => update("min_per_order", parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <Label className="text-xs">Máxima *</Label>
                  <Input type="number" min={1} value={tier.max_per_order} onChange={(e) => update("max_per_order", parseInt(e.target.value) || 5)} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição do ingresso (opcional)</Label>
              <Textarea
                value={tier.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                maxLength={100}
                placeholder="Ex.: Esse ingresso dá direito a um copo"
              />
              <p className="text-xs text-muted-foreground mt-0.5 text-right">{100 - tier.description.length} caracteres restantes</p>
            </div>
          </div>

          {/* Advanced options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={tier.is_transferable} onCheckedChange={(v) => update("is_transferable", v)} />
              <Label className="text-xs">Transferível</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={tier.is_hidden_by_default} onCheckedChange={(v) => update("is_hidden_by_default", v)} />
              <Label className="text-xs">Ocultar até código de acesso</Label>
            </div>
            {tier.is_hidden_by_default && (
              <div>
                <Label className="text-xs">Código de acesso</Label>
                <Input value={tier.unlock_code} onChange={(e) => update("unlock_code", e.target.value)} placeholder="Ex: VIP2025" maxLength={50} />
              </div>
            )}

            {capacityGroups.length > 0 && (
              <div>
                <Label className="text-xs">Grupo de capacidade</Label>
                <Select value={tier.capacity_group_id || "none"} onValueChange={(v) => update("capacity_group_id", v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {capacityGroups.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.sold_count}/{g.capacity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasSeatMap && (
              <div className="flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Cor do setor</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SECTOR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => update("sector_color", color)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        tier.sector_color === color ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded",
              tier.is_visible ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {tier.is_visible ? "VISÍVEL" : "OCULTO"}
            </span>
            <Switch checked={tier.is_visible} onCheckedChange={(v) => update("is_visible", v)} />
            <Label className="text-xs">Visibilidade</Label>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSave}>{isEdit ? "Salvar" : "Criar ingresso"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Venue step ── */
function VenueStep({ form, updateField }: { form: any; updateField: (f: string, v: any) => void }) {
  const { states } = useIBGEStates();
  const { cities, loading: citiesLoading } = useIBGECities(form.venue_state);
  const [citySearch, setCitySearch] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const filteredCities = citySearch
    ? cities.filter((c) => c.nome.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const handleCEPBlur = async () => {
    const cep = form.venue_zip?.replace(/\D/g, "");
    if (cep?.length === 8) {
      setCepLoading(true);
      try {
        const addr = await fetchAddress(cep);
        if (addr) {
          updateField("venue_address", addr.street || "");
          updateField("venue_neighborhood", addr.neighborhood || "");
          updateField("venue_city", addr.city || "");
          updateField("venue_state", addr.state || "");
        }
      } catch {}
      setCepLoading(false);
    }
  };

  if (form.is_online) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Link do evento online</CardTitle>
          <CardDescription>Informe o link de acesso para os participantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL da transmissão *</Label>
            <Input value={form.online_url} onChange={(e) => updateField("online_url", e.target.value)} placeholder="https://meet.google.com/... ou https://zoom.us/..." />
            <p className="text-xs text-muted-foreground mt-1">Cole o link do Google Meet, Zoom, YouTube Live, ou qualquer outra plataforma.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Onde o evento vai acontecer?</CardTitle>
        <CardDescription>Informe o endereço completo do local</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nome do local *</Label>
          <Input value={form.venue_name} onChange={(e) => updateField("venue_name", e.target.value)} placeholder="Ex: Allianz Parque, Teatro Municipal" maxLength={100} />
          <p className="text-xs text-muted-foreground mt-1">{100 - (form.venue_name?.length || 0)} caracteres restantes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>CEP</Label>
            <Input value={form.venue_zip} onChange={(e) => updateField("venue_zip", e.target.value)} onBlur={handleCEPBlur} placeholder="00000-000" maxLength={9} />
            {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Rua / Avenida</Label>
            <Input value={form.venue_address} onChange={(e) => updateField("venue_address", e.target.value)} placeholder="Nome da rua" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Número</Label>
            <Input value={form.venue_number} onChange={(e) => updateField("venue_number", e.target.value)} placeholder="123" />
          </div>
          <div>
            <Label>Complemento</Label>
            <Input value={form.venue_complement} onChange={(e) => updateField("venue_complement", e.target.value)} placeholder="Sala, Bloco, etc." maxLength={250} />
          </div>
        </div>

        <div>
          <Label>Bairro</Label>
          <Input value={form.venue_neighborhood} onChange={(e) => updateField("venue_neighborhood", e.target.value)} placeholder="Nome do bairro" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Estado</Label>
            <Select value={form.venue_state} onValueChange={(v) => { updateField("venue_state", v); updateField("venue_city", ""); setCitySearch(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.sigla} value={s.sigla}>{s.nome} ({s.sigla})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cidade</Label>
            {citiesLoading ? (
              <Input disabled placeholder="Carregando..." />
            ) : form.venue_state ? (
              <Select value={form.venue_city} onValueChange={(v) => updateField("venue_city", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <Input placeholder="Buscar cidade..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="h-8 text-sm" onClick={(e) => e.stopPropagation()} />
                  </div>
                  {filteredCities.slice(0, 100).map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                  {filteredCities.length > 100 && <p className="text-xs text-muted-foreground px-2 py-1">Digite para filtrar...</p>}
                </SelectContent>
              </Select>
            ) : (
              <Input disabled placeholder="Selecione o estado primeiro" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
