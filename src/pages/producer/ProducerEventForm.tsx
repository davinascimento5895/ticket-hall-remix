import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, ArrowLeft, ArrowRight, Upload, MapPin, Globe, Video, Link2, Image as ImageIcon, Calendar, Ticket, FileText, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { fetchAddressFromCEP } from "@/lib/cep";
import { cn } from "@/lib/utils";

const stepLabels = ["Tipo", "Informações", "Local", "Ingressos", "Formulário", "Produtos", "Configurações", "Revisão"];

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
}

export default function ProducerEventForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(isEdit ? 1 : 0);

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

  // Load capacity groups for tier assignment
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

  const addTier = () => {
    setTiers((prev) => [...prev, {
      name: "", tier_type: "paid", price: 0, quantity_total: 100, description: "",
      min_per_order: 1, max_per_order: 10, is_transferable: true,
      capacity_group_id: null, is_hidden_by_default: false, unlock_code: "",
      sector_color: SECTOR_COLORS[prev.length % SECTOR_COLORS.length],
    }]);
  };

  const updateTier = (index: number, field: string, value: any) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
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
    try {
      let coverUrl = form.cover_image_url;
      if (coverFile) coverUrl = await handleUploadCover();

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

      // Combine address fields
      let fullAddress = form.venue_address;
      if (form.venue_number) fullAddress += `, ${form.venue_number}`;
      if (form.venue_complement) fullAddress += ` - ${form.venue_complement}`;
      if (form.venue_neighborhood) fullAddress += `, ${form.venue_neighborhood}`;

      const eventData: any = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        category: form.category,
        venue_name: form.venue_name,
        venue_address: fullAddress,
        venue_city: form.venue_city,
        venue_state: form.venue_state,
        venue_zip: form.venue_zip,
        is_online: form.is_online,
        online_url: form.online_url,
        minimum_age: form.minimum_age,
        max_capacity: form.max_capacity,
        cover_image_url: coverUrl,
        has_seat_map: form.has_seat_map,
        seat_map_config: seatMapConfig,
        has_virtual_queue: form.has_virtual_queue,
        queue_capacity: form.queue_capacity,
        has_certificates: form.has_certificates,
        has_insurance_option: form.has_insurance_option,
        insurance_price: form.insurance_price,
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

  const stepIcons = [Globe, FileText, MapPin, Ticket, FileText, Settings, Settings, Eye];

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">
        {isEdit ? "Editar Evento" : form.is_online ? "Criar Evento Online" : "Criar Evento Presencial"}
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stepLabels.map((s, i) => {
          // Skip type step for edit mode
          if (i === 0 && isEdit) return null;
          const Icon = stepIcons[i];
          return (
            <button 
              key={s} 
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                i === step ? "bg-primary text-primary-foreground" : 
                i < step ? "bg-primary/15 text-primary" : 
                "bg-secondary text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s}</span>
            </button>
          );
        })}
      </div>

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
                {/* Presencial Option */}
                <label 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    !form.is_online ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
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

                {/* Online Option */}
                <label 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    form.is_online ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
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

          {/* Platform selection for online */}
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
                <Input 
                  value={form.title} 
                  onChange={(e) => updateField("title", e.target.value)} 
                  placeholder="Nome do seu evento" 
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">{100 - form.title.length} caracteres restantes</p>
              </div>

              <div>
                <Label>URL personalizada</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">tickethall.com/eventos/</span>
                  <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="flex-1" />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label>Imagem de divulgação</Label>
                <div 
                  className={cn(
                    "mt-2 border-2 border-dashed rounded-xl transition-colors",
                    coverPreview ? "border-primary/50" : "border-border hover:border-primary/50"
                  )}
                >
                  {coverPreview ? (
                    <div className="relative">
                      <img 
                        src={coverPreview} 
                        alt="Capa do evento" 
                        className="w-full aspect-[1600/838] object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                          <Button variant="secondary" size="sm" className="gap-2" asChild>
                            <span><Upload className="h-4 w-4" />Trocar imagem</span>
                          </Button>
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
                      <p className="text-xs text-muted-foreground mt-1 text-center px-4">
                        Dimensão recomendada: 1600 x 838 pixels (proporção 16:9).<br />
                        Formato JPEG, PNG ou WebP de no máximo 2MB.
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
                <Textarea 
                  value={form.description} 
                  onChange={(e) => updateField("description", e.target.value)} 
                  rows={6} 
                  placeholder="Conte todos os detalhes do seu evento, como a programação e os diferenciais da sua produção..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
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
      {step === 2 && (
        <VenueStep form={form} updateField={updateField} />
      )}

      {/* Step 3: Tickets */}
      {step === 3 && (
        <div className="space-y-6">
          {isEdit && <CapacityGroupsManager eventId={id!} />}
          {isEdit && <TaxesFeesManager eventId={id!} />}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ingressos
                </CardTitle>
                <CardDescription>Configure os tipos de ingresso do seu evento</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addTier} className="gap-1">
                <Plus className="h-4 w-4" />Adicionar lote
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiers.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum lote criado ainda.</p>
                  <Button variant="outline" size="sm" onClick={addTier} className="mt-3 gap-1">
                    <Plus className="h-4 w-4" />Criar primeiro lote
                  </Button>
                </div>
              )}
              {tiers.map((tier, i) => (
                <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Lote {i + 1}</span>
                    <button onClick={() => removeTier(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nome *</Label>
                      <Input value={tier.name} onChange={(e) => updateTier(i, "name", e.target.value)} placeholder="Ex: Pista, VIP, 1º Lote" />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select value={tier.tier_type} onValueChange={(v) => updateTier(i, "tier_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="donation">Doação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Preço (R$)</Label>
                      <Input type="number" min={0} step={0.01} value={tier.price} onChange={(e) => updateTier(i, "price", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Quantidade total *</Label>
                      <Input type="number" min={1} value={tier.quantity_total} onChange={(e) => updateTier(i, "quantity_total", parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <Label className="text-xs">Mín. por pedido</Label>
                      <Input type="number" min={1} value={tier.min_per_order} onChange={(e) => updateTier(i, "min_per_order", parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <Label className="text-xs">Máx. por pedido</Label>
                      <Input type="number" min={1} value={tier.max_per_order} onChange={(e) => updateTier(i, "max_per_order", parseInt(e.target.value) || 10)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Textarea value={tier.description} onChange={(e) => updateTier(i, "description", e.target.value)} rows={2} />
                  </div>

                  {capacityGroups.length > 0 && (
                    <div>
                      <Label className="text-xs">Grupo de capacidade</Label>
                      <Select value={tier.capacity_group_id || "none"} onValueChange={(v) => updateTier(i, "capacity_group_id", v === "none" ? null : v)}>
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

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={tier.is_transferable} onCheckedChange={(v) => updateTier(i, "is_transferable", v)} />
                      <Label className="text-xs">Transferível</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={tier.is_hidden_by_default} onCheckedChange={(v) => updateTier(i, "is_hidden_by_default", v)} />
                      <Label className="text-xs">Ocultar até código</Label>
                    </div>
                  </div>
                  {tier.is_hidden_by_default && (
                    <div>
                      <Label className="text-xs">Código de acesso</Label>
                      <Input value={tier.unlock_code} onChange={(e) => updateTier(i, "unlock_code", e.target.value)} placeholder="Ex: VIP2025" maxLength={50} />
                    </div>
                  )}

                  {form.has_seat_map && (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs whitespace-nowrap">Cor do setor</Label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {SECTOR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateTier(i, "sector_color", color)}
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
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Checkout Questions */}
      {step === 4 && (
        isEdit ? (
          <CheckoutQuestionsBuilder eventId={id!} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Salve o evento primeiro para configurar o formulário de participante.</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Step 5: Products */}
      {step === 5 && (
        isEdit ? (
          <EventProductsManager eventId={id!} />
        ) : (
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
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Idade mínima</Label>
              <Input type="number" min={0} value={form.minimum_age} onChange={(e) => updateField("minimum_age", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Capacidade máxima</Label>
              <Input type="number" min={0} value={form.max_capacity} onChange={(e) => updateField("max_capacity", parseInt(e.target.value) || 0)} />
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
                  {seatMapImageUrl && (
                    <img src={seatMapImageUrl} alt="Mapa" className="w-full max-h-48 object-contain rounded-lg border border-border mb-2 bg-muted/30" />
                  )}
                  <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSeatMapFile(file);
                      setSeatMapImageUrl(URL.createObjectURL(file));
                    }
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
              <RadioGroup 
                value={form.visibility} 
                onValueChange={(v) => updateField("visibility", v)}
                className="flex gap-4 mt-2"
              >
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
                {form.visibility === "public" 
                  ? "Evento visível para todos na plataforma" 
                  : "Evento acessível apenas com link direto"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 7: Review */}
      {step === 7 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Revisão
            </CardTitle>
            <CardDescription>Confira os dados antes de publicar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coverPreview && (
              <img src={coverPreview} alt="Capa" className="w-full aspect-[16/9] object-cover rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
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
              
              <span className="text-muted-foreground">Lotes:</span>
              <span className="text-foreground">{tiers.length} lote(s)</span>
            </div>

            {tiers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-foreground">Ingressos:</p>
                {tiers.map((t, i) => (
                  <div key={i} className="flex justify-between p-2 rounded bg-secondary text-sm">
                    <span>{t.name}{t.is_hidden_by_default ? " 🔒" : ""}</span>
                    <span>R$ {t.price.toFixed(2).replace(".", ",")} · {t.quantity_total} un.</span>
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
          {step === stepLabels.length - 1 ? (
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
  );
}

/** Venue step with address fields and CEP autocomplete */
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
        const addr = await fetchAddressFromCEP(cep);
        if (addr) {
          updateField("venue_address", addr.logradouro || "");
          updateField("venue_neighborhood", addr.bairro || "");
          updateField("venue_city", addr.localidade || "");
          updateField("venue_state", addr.uf || "");
        }
      } catch {}
      setCepLoading(false);
    }
  };

  if (form.is_online) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Link do evento online
          </CardTitle>
          <CardDescription>Informe o link de acesso para os participantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL da transmissão *</Label>
            <Input 
              value={form.online_url} 
              onChange={(e) => updateField("online_url", e.target.value)} 
              placeholder="https://meet.google.com/... ou https://zoom.us/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cole o link do Google Meet, Zoom, YouTube Live, ou qualquer outra plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Onde o evento vai acontecer?
        </CardTitle>
        <CardDescription>Informe o endereço completo do local</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nome do local *</Label>
          <Input 
            value={form.venue_name} 
            onChange={(e) => updateField("venue_name", e.target.value)} 
            placeholder="Ex: Allianz Parque, Teatro Municipal, Centro de Convenções"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{100 - (form.venue_name?.length || 0)} caracteres restantes</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>CEP</Label>
            <Input 
              value={form.venue_zip} 
              onChange={(e) => updateField("venue_zip", e.target.value)} 
              onBlur={handleCEPBlur}
              placeholder="00000-000"
              maxLength={9}
            />
            {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
          </div>
          <div className="col-span-2">
            <Label>Rua / Avenida</Label>
            <Input 
              value={form.venue_address} 
              onChange={(e) => updateField("venue_address", e.target.value)}
              placeholder="Nome da rua"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Número</Label>
            <Input 
              value={form.venue_number} 
              onChange={(e) => updateField("venue_number", e.target.value)}
              placeholder="123"
            />
          </div>
          <div>
            <Label>Complemento</Label>
            <Input 
              value={form.venue_complement} 
              onChange={(e) => updateField("venue_complement", e.target.value)}
              placeholder="Sala, Bloco, etc."
              maxLength={250}
            />
          </div>
        </div>

        <div>
          <Label>Bairro</Label>
          <Input 
            value={form.venue_neighborhood} 
            onChange={(e) => updateField("venue_neighborhood", e.target.value)}
            placeholder="Nome do bairro"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Estado</Label>
            <Select 
              value={form.venue_state} 
              onValueChange={(v) => { 
                updateField("venue_state", v); 
                updateField("venue_city", ""); 
                setCitySearch(""); 
              }}
            >
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
                    <Input
                      placeholder="Buscar cidade..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredCities.slice(0, 100).map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                  {filteredCities.length > 100 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">Digite para filtrar...</p>
                  )}
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
