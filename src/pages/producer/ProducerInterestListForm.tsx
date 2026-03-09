import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  generateUniqueSlug, createList, updateList, getListById, getListFields, uploadListImage,
  type InterestListField,
} from "@/lib/api-interest-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Pencil, Trash2, ImageIcon, Upload, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DEFAULT_FIELDS: InterestListField[] = [
  { field_name: "Nome", field_type: "text", placeholder: "Digite seu nome", is_required: true, sort_order: 0 },
  { field_name: "Sobrenome", field_type: "text", placeholder: "Digite seu sobrenome", is_required: true, sort_order: 1 },
  { field_name: "E-mail", field_type: "email", placeholder: "Digite seu melhor e-mail", is_required: true, sort_order: 2 },
  { field_name: "Celular", field_type: "phone", placeholder: "Digite seu celular", is_required: true, sort_order: 3 },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  email: "E-mail",
  phone: "Telefone",
  number: "Número",
  select: "Seleção",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export default function ProducerInterestListForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venueName, setVenueName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>("");
  const [hasLimit, setHasLimit] = useState(false);
  const [maxSubmissions, setMaxSubmissions] = useState<number | "">(100);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [fields, setFields] = useState<InterestListField[]>(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add field dialog
  const [fieldDialog, setFieldDialog] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Load existing data
  const { data: existing } = useQuery({
    queryKey: ["interest-list", id],
    queryFn: () => getListById(id!),
    enabled: isEdit,
  });

  const { data: existingFields } = useQuery({
    queryKey: ["interest-list-fields", id],
    queryFn: () => getListFields(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description || "");
      setVenueName(existing.venue_name || "");
      setImageUrl(existing.image_url);
      if (existing.start_date) {
        const d = new Date(existing.start_date);
        setStartDate(d);
        setStartTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
      if (existing.max_submissions) {
        setHasLimit(true);
        setMaxSubmissions(existing.max_submissions);
      }
      if (existing.expires_at) {
        setHasExpiry(true);
        setExpiresAt(new Date(existing.expires_at));
      }
    }
  }, [existing]);

  useEffect(() => {
    if (existingFields?.length) setFields(existingFields);
  }, [existingFields]);

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter até 5MB"); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast.error("Use JPG ou PNG"); return; }
    setUploading(true);
    try {
      const url = await uploadListImage(file, user.id);
      setImageUrl(url);
      toast.success("Imagem carregada!");
    } catch {
      toast.error("Erro ao carregar imagem");
    } finally {
      setUploading(false);
    }
  };

  // Field management
  const moveField = (idx: number, dir: -1 | 1) => {
    const next = [...fields];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setFields(next.map((f, i) => ({ ...f, sort_order: i })));
  };

  const openAddField = () => {
    setEditingFieldIdx(null);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldPlaceholder("");
    setNewFieldRequired(false);
    setFieldDialog(true);
  };

  const openEditField = (idx: number) => {
    const f = fields[idx];
    setEditingFieldIdx(idx);
    setNewFieldName(f.field_name);
    setNewFieldType(f.field_type);
    setNewFieldPlaceholder(f.placeholder);
    setNewFieldRequired(f.is_required);
    setFieldDialog(true);
  };

  const saveField = () => {
    if (!newFieldName.trim()) { toast.error("Nome do campo é obrigatório"); return; }
    const field: InterestListField = {
      field_name: newFieldName.trim(),
      field_type: newFieldType,
      placeholder: newFieldPlaceholder.trim() || `Digite ${newFieldName.trim().toLowerCase()}`,
      is_required: newFieldRequired,
      sort_order: editingFieldIdx !== null ? editingFieldIdx : fields.length,
    };
    if (editingFieldIdx !== null) {
      const next = [...fields];
      next[editingFieldIdx] = field;
      setFields(next);
    } else {
      setFields([...fields, field]);
    }
    setFieldDialog(false);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx).map((f, i) => ({ ...f, sort_order: i })));
  };

  // Submit
  const handleSubmit = async (status: string = "published") => {
    if (!name.trim()) { toast.error("Nome da lista é obrigatório"); return; }
    if (!user) return;
    setSaving(true);
    try {
      let dateISO: string | undefined;
      if (startDate) {
        const d = new Date(startDate);
        if (startTime) {
          const [h, m] = startTime.split(":").map(Number);
          d.setHours(h, m, 0, 0);
        }
        dateISO = d.toISOString();
      }

      const payload = {
        producer_id: user.id,
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl || undefined,
        venue_name: venueName.trim() || undefined,
        start_date: dateISO,
        max_submissions: hasLimit && maxSubmissions ? Number(maxSubmissions) : null,
        expires_at: hasExpiry && expiresAt ? expiresAt.toISOString() : null,
        status,
      };

      if (isEdit) {
        await updateList(id!, payload, fields);
        toast.success("Lista atualizada!");
      } else {
        const slug = await generateUniqueSlug();
        await createList({ ...payload, slug }, fields);
        toast.success("Lista criada!");
      }
      navigate("/producer/interest-lists");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Editar lista" : "Criar nova lista"}</h1>
          <p className="text-sm text-muted-foreground">Configure uma nova lista de interesse</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/producer/interest-lists")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para suas listas
        </Button>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Informações básicas da lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Nome da lista *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você quer chamar sua lista?" maxLength={120} />
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label className="font-semibold">Limite de inscrições</Label>
            <div className="flex items-center gap-3">
              <Switch checked={hasLimit} onCheckedChange={setHasLimit} />
              <span className="text-sm text-foreground">Quero limitar o número de inscrições</span>
            </div>
            {hasLimit && (
              <Input
                type="number"
                min={1}
                value={maxSubmissions}
                onChange={(e) => setMaxSubmissions(e.target.value ? Number(e.target.value) : "")}
                placeholder="Ex: 500"
                className="mt-2 max-w-[200px]"
              />
            )}
            <p className="text-xs text-muted-foreground">Quando o limite for atingido, a lista será encerrada automaticamente.</p>
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label className="font-semibold">Data de expiração</Label>
            <div className="flex items-center gap-3">
              <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
              <span className="text-sm text-foreground">Definir uma data para encerrar a lista</span>
            </div>
            {hasExpiry && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("mt-2 max-w-[240px] justify-start text-left font-normal", !expiresAt && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} disabled={(d) => d < new Date()} />
                </PopoverContent>
              </Popover>
            )}
            <p className="text-xs text-muted-foreground">Sem data, a lista continua aberta até você decidir fechar.</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição da lista</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte, em poucas palavras, do que se trata a lista. Pode ser uma ideia, um projeto ou um evento que está por vir."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{description.length} caracteres</p>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label>Local</Label>
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Digite o endereço ou local do evento" maxLength={200} />
            <p className="text-xs text-muted-foreground">Este local será exibido na página de inscrição da lista.</p>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora de Início</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione um horário" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Esta data e hora será exibida na página de inscrição da lista.</p>
        </CardContent>
      </Card>

      {/* Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Imagens da lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-64 aspect-video rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Lista" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-1" />
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Imagem da lista</p>
              <p className="text-xs text-muted-foreground">Quer dar uma cara mais personalizada para sua lista? Adicione uma imagem aqui.</p>
              <p className="text-xs text-muted-foreground">Pra sua imagem ficar perfeita na lista, use o formato 16:9 (ex: 1920×1080 px)</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Carregar imagem
              </Button>
              <p className="text-xs text-muted-foreground">Formatos suportados: JPG, PNG · até 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Construtor de formulário</CardTitle>
          <CardDescription>Agora é hora de decidir quais informações você quer pedir de quem se inscrever.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Campos do formulário</p>
            <Button variant="outline" size="sm" onClick={openAddField}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar campo
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{field.field_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{FIELD_TYPE_LABELS[field.field_type] || field.field_type}</Badge>
                    {field.is_required && <Badge className="text-[10px]">Obrigatório</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveField(idx, -1)}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                    {idx < fields.length - 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveField(idx, 1)}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditField(idx)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {idx >= 4 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeField(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input disabled placeholder={field.placeholder} className="max-w-md bg-muted/20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/producer/interest-lists")}>Cancelar</Button>
        <Button onClick={() => handleSubmit("published")} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? "Salvar alterações" : "Publicar lista"}
        </Button>
      </div>

      {/* Add/Edit field dialog */}
      <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFieldIdx !== null ? "Editar campo" : "Adicionar novo campo"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Configure as propriedades do campo para o formulário de inscrição.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de campo</Label>
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([val, lbl]) => (
                    <SelectItem key={val} value={val}>{lbl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do campo</Label>
              <Input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Ex: Nome completo" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} placeholder="Ex: Digite seu nome completo" maxLength={100} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Obrigatório</Label>
              <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
              <span className="text-sm text-muted-foreground">{newFieldRequired ? "Sim" : "Não"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialog(false)}>Cancelar</Button>
            <Button onClick={saveField}>{editingFieldIdx !== null ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
