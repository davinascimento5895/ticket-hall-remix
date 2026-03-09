import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { createEvent, updateEvent, createTicketTier, deleteTicketTier } from "@/lib/api-producer";
import { getEventBySlug, getEventTiers } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckoutQuestionsBuilder } from "@/components/producer/CheckoutQuestionsBuilder";
import { TaxesFeesManager } from "@/components/producer/TaxesFeesManager";
import { CapacityGroupsManager } from "@/components/producer/CapacityGroupsManager";
import { EventProductsManager } from "@/components/producer/EventProductsManager";
import { getCapacityGroups } from "@/lib/api-checkout";
import { EVENT_CATEGORIES } from "@/lib/categories";

const stepLabels = ["Informações", "Local", "Ingressos", "Formulário", "Produtos", "Configurações", "Revisão"];

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
}

export default function ProducerEventForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: "", slug: "", description: "", category: "shows",
    start_date: "", end_date: "", doors_open_time: "",
    venue_name: "", venue_address: "", venue_city: "", venue_state: "", venue_zip: "",
    is_online: false, online_url: "",
    minimum_age: 0, max_capacity: 0, cover_image_url: "", status: "draft",
  });

  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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
          category: data.category || "music",
          start_date: data.start_date?.slice(0, 16) || "", end_date: data.end_date?.slice(0, 16) || "",
          doors_open_time: data.doors_open_time?.slice(0, 16) || "",
          venue_name: data.venue_name || "", venue_address: data.venue_address || "",
          venue_city: data.venue_city || "", venue_state: data.venue_state || "",
          venue_zip: data.venue_zip || "", is_online: data.is_online || false,
          online_url: data.online_url || "", minimum_age: data.minimum_age || 0,
          max_capacity: data.max_capacity || 0, cover_image_url: data.cover_image_url || "",
          status: data.status || "draft",
        });
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
        setTiers(data.map((t) => ({
          id: t.id, name: t.name, tier_type: t.tier_type || "paid",
          price: t.price || 0, quantity_total: t.quantity_total,
          description: t.description || "",
          min_per_order: t.min_per_order || 1, max_per_order: t.max_per_order || 10,
          is_transferable: t.is_transferable ?? true,
          capacity_group_id: (t as any).capacity_group_id || null,
          is_hidden_by_default: (t as any).is_hidden_by_default ?? false,
          unlock_code: (t as any).unlock_code || "",
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
    }]);
  };

  const updateTier = (index: number, field: string, value: any) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
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

      const eventData: any = {
        ...form, cover_image_url: coverUrl,
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

  // Use centralized categories from lib/categories.ts

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">{isEdit ? "Editar Evento" : "Criar Evento"}</h1>

      {/* Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stepLabels.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {i < step ? <Check className="h-3.5 w-3.5" /> : <span className="w-5 text-center">{i + 1}</span>}
            {s}
          </button>
        ))}
      </div>

      {/* Step 0: Basic Info */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Título do evento *</Label><Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Nome do seu evento" /></div>
            <div><Label>URL personalizada</Label><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">tickethall.com/eventos/</span><Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="flex-1" /></div></div>
            <div><Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={5} placeholder="Descreva o evento..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Início *</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} /></div>
              <div><Label>Término *</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => updateField("end_date", e.target.value)} /></div>
            </div>
            <div><Label>Abertura dos portões</Label><Input type="datetime-local" value={form.doors_open_time} onChange={(e) => updateField("doors_open_time", e.target.value)} /></div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Venue */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Local</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><Switch checked={form.is_online} onCheckedChange={(v) => updateField("is_online", v)} /><Label>Evento online</Label></div>
            {form.is_online ? (
              <div><Label>URL da transmissão</Label><Input value={form.online_url} onChange={(e) => updateField("online_url", e.target.value)} placeholder="https://..." /></div>
            ) : (
              <>
                <div><Label>Nome do local</Label><Input value={form.venue_name} onChange={(e) => updateField("venue_name", e.target.value)} placeholder="Ex: Allianz Parque" /></div>
                <div><Label>Endereço</Label><Input value={form.venue_address} onChange={(e) => updateField("venue_address", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cidade</Label><Input value={form.venue_city} onChange={(e) => updateField("venue_city", e.target.value)} /></div>
                  <div><Label>Estado</Label><Input value={form.venue_state} onChange={(e) => updateField("venue_state", e.target.value)} placeholder="SP" maxLength={2} /></div>
                </div>
                <div><Label>CEP</Label><Input value={form.venue_zip} onChange={(e) => updateField("venue_zip", e.target.value)} placeholder="00000-000" /></div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Tickets */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Capacity Groups */}
          {isEdit && <CapacityGroupsManager eventId={id!} />}

          {/* Taxes & Fees */}
          {isEdit && <TaxesFeesManager eventId={id!} />}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ingressos</CardTitle>
              <Button variant="outline" size="sm" onClick={addTier} className="gap-1"><Plus className="h-4 w-4" />Adicionar lote</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum lote criado. Adicione um lote de ingressos.</p>}
              {tiers.map((tier, i) => (
                <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Lote {i + 1}</span>
                    <button onClick={() => removeTier(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-xs">Nome *</Label><Input value={tier.name} onChange={(e) => updateTier(i, "name", e.target.value)} placeholder="Ex: Pista, VIP, 1º Lote" /></div>
                    <div><Label className="text-xs">Tipo</Label>
                      <Select value={tier.tier_type} onValueChange={(v) => updateTier(i, "tier_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="donation">Doação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Preço (R$)</Label><Input type="number" min={0} step={0.01} value={tier.price} onChange={(e) => updateTier(i, "price", parseFloat(e.target.value) || 0)} /></div>
                    <div><Label className="text-xs">Quantidade total *</Label><Input type="number" min={1} value={tier.quantity_total} onChange={(e) => updateTier(i, "quantity_total", parseInt(e.target.value) || 1)} /></div>
                    <div><Label className="text-xs">Mín. por pedido</Label><Input type="number" min={1} value={tier.min_per_order} onChange={(e) => updateTier(i, "min_per_order", parseInt(e.target.value) || 1)} /></div>
                    <div><Label className="text-xs">Máx. por pedido</Label><Input type="number" min={1} value={tier.max_per_order} onChange={(e) => updateTier(i, "max_per_order", parseInt(e.target.value) || 10)} /></div>
                  </div>
                  <div><Label className="text-xs">Descrição</Label><Textarea value={tier.description} onChange={(e) => updateTier(i, "description", e.target.value)} rows={2} /></div>

                  {/* Capacity group assignment */}
                  {capacityGroups.length > 0 && (
                    <div>
                      <Label className="text-xs">Grupo de capacidade</Label>
                      <Select value={tier.capacity_group_id || "none"} onValueChange={(v) => updateTier(i, "capacity_group_id", v === "none" ? null : v)}>
                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {capacityGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name} ({g.sold_count}/{g.capacity})</SelectItem>)}
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
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Checkout Questions */}
      {step === 3 && (
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

      {/* Step 4: Products */}
      {step === 4 && (
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

      {/* Step 5: Settings */}
      {step === 5 && (
        <Card>
          <CardHeader><CardTitle>Configurações</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Idade mínima</Label><Input type="number" min={0} value={form.minimum_age} onChange={(e) => updateField("minimum_age", parseInt(e.target.value) || 0)} /></div>
            <div><Label>Capacidade máxima</Label><Input type="number" min={0} value={form.max_capacity} onChange={(e) => updateField("max_capacity", parseInt(e.target.value) || 0)} /></div>
            <div>
              <Label>Imagem de capa</Label>
              {form.cover_image_url && <img src={form.cover_image_url} alt="Capa" className="w-full h-40 object-cover rounded-lg mb-2" />}
              <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <Card>
          <CardHeader><CardTitle>Revisão</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Título:</span><span className="text-foreground font-medium">{form.title}</span>
              <span className="text-muted-foreground">Categoria:</span><span className="text-foreground">{EVENT_CATEGORIES.find((c) => c.value === form.category)?.label}</span>
              <span className="text-muted-foreground">Início:</span><span className="text-foreground">{form.start_date ? new Date(form.start_date).toLocaleString("pt-BR") : "—"}</span>
              <span className="text-muted-foreground">Término:</span><span className="text-foreground">{form.end_date ? new Date(form.end_date).toLocaleString("pt-BR") : "—"}</span>
              <span className="text-muted-foreground">Local:</span><span className="text-foreground">{form.is_online ? "Online" : form.venue_name || "—"}</span>
              <span className="text-muted-foreground">Lotes:</span><span className="text-foreground">{tiers.length} lote(s)</span>
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
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="gap-1">
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
