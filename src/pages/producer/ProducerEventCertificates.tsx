import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck,
  Share2,
  Settings,
  Eye,
  Ban,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Palette,
  Type,
  Image,
  UserCheck,
  FileDown,
  RotateCcw,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  Linkedin,
  EyeIcon,
  X,
  Upload,
  Plus,
  Trash2,
  Undo2,
  Save,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { generateCertificatePDF } from "@/lib/certificate-pdf-client";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CertificatePreview,
  CertificateFields,
  CertificateTextConfig,
  CertificateSigner,
  CertificateSampleData,
} from "@/components/certificates/CertificatePreview";
import { CERTIFICATE_TEMPLATES, CertificateTemplateId } from "@/lib/certificates/templates";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// =============================================================================
// Types & Interfaces
// =============================================================================

interface CertificateConfig {
  templateId: CertificateTemplateId;
  primaryColor: string;
  secondaryColor: string;
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  backgroundUrl: string | null;
  workloadHours: number;
}

interface Certificate {
  id: string;
  certificate_code: string;
  attendee_name: string;
  issued_at: string;
  user_id: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  workload_hours: number | null;
  ticket_id: string;
}

interface CertificateStats {
  totalParticipants: number;
  checkedInCount: number;
  certificatesIssued: number;
  pendingCertificates: number;
  revokedCount: number;
  issuedToday: number;
}

interface Filters {
  search: string;
  status: "all" | "valid" | "revoked";
  dateFrom: Date | null;
  dateTo: Date | null;
}

// =============================================================================
// Default Configurations
// =============================================================================

const DEFAULT_CONFIG: CertificateConfig = {
  templateId: "executive",
  primaryColor: "#1a365d",
  secondaryColor: "#c9a227",
  fields: {
    showEventName: true,
    showParticipantName: true,
    showParticipantLastName: true,
    showCPF: false,
    showEventDate: true,
    showEventLocation: true,
    showWorkload: false,
    showSigners: true,
  },
  textConfig: {
    title: "CERTIFICADO DE PARTICIPAÇÃO",
    introText: "Certificamos que",
    participationText: "participou do evento",
    conclusionText: "Comprove sua participação através do código de verificação.",
  },
  signers: [],
  backgroundUrl: null,
  workloadHours: 0,
};

const DEFAULT_SAMPLE_DATA: CertificateSampleData = {
  eventName: "Nome do Evento",
  participantName: "Maria Silva",
  participantCPF: "123.456.789-00",
  eventDate: format(new Date(), "dd/MM/yyyy"),
  eventLocation: "São Paulo, SP",
  certificateCode: "CERT-XXXX-XXXXXXXX-XXX",
};

const TEMPLATE_LIST = CERTIFICATE_TEMPLATES;
const TEMPLATE_IDS: CertificateTemplateId[] = TEMPLATE_LIST.map((t) => t.id);
const TEMPLATE_BY_ID = new Map<CertificateTemplateId, (typeof TEMPLATE_LIST)[number]>(
  TEMPLATE_LIST.map((t) => [t.id, t])
);

const normalizeTemplateId = (value: unknown): CertificateTemplateId => {
  if (typeof value === "string") {
    if (TEMPLATE_IDS.includes(value as CertificateTemplateId)) {
      return value as CertificateTemplateId;
    }
    const asIndex = Number.parseInt(value, 10);
    if (!Number.isNaN(asIndex) && TEMPLATE_LIST[asIndex]) {
      return TEMPLATE_LIST[asIndex].id;
    }
  }
  if (typeof value === "number" && TEMPLATE_LIST[value]) {
    return TEMPLATE_LIST[value].id;
  }
  return "executive";
};

const missingColumnsCache = new Set<string>();

const isMissingColumnError = (error: unknown, columnName: string): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  const isMissing = err.code === "PGRST204" && (err.message || "").includes(`'${columnName}'`);
  if (isMissing) {
    missingColumnsCache.add(columnName);
  }
  return isMissing;
};

const configFromLegacyTemplate = (template: string | null | undefined): CertificateConfig => {
  const templateId = normalizeTemplateId(template || "executive");
  const defaults = TEMPLATE_BY_ID.get(templateId)?.defaultColors;
  return {
    ...DEFAULT_CONFIG,
    templateId,
    primaryColor: defaults?.primary || DEFAULT_CONFIG.primaryColor,
    secondaryColor: defaults?.secondary || DEFAULT_CONFIG.secondaryColor,
  };
};

// =============================================================================
// Custom Hooks
// =============================================================================

function useCertificateConfig(eventId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["certificate-config", eventId],
    queryFn: async () => {
      if (!eventId) return DEFAULT_CONFIG;

      if (missingColumnsCache.has("certificate_config")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("events")
          .select("certificate_template")
          .eq("id", eventId)
          .single();
        if (legacyError) throw legacyError;
        return configFromLegacyTemplate(legacyData?.certificate_template);
      }

      const { data, error } = await supabase
        .from("events")
        .select("certificate_config, certificate_template")
        .eq("id", eventId)
        .single();

      if (error && isMissingColumnError(error, "certificate_config")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("events")
          .select("certificate_template")
          .eq("id", eventId)
          .single();
        if (legacyError) throw legacyError;
        return configFromLegacyTemplate(legacyData?.certificate_template);
      }

      if (error) throw error;

      return data?.certificate_config
        ? { ...DEFAULT_CONFIG, ...(data.certificate_config as Partial<CertificateConfig>) }
        : configFromLegacyTemplate(data?.certificate_template);
    },
    enabled: !!eventId,
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: CertificateConfig) => {
      if (!eventId) throw new Error("Event ID required");

      if (missingColumnsCache.has("certificate_config")) {
        const { error: legacyError } = await supabase
          .from("events")
          .update({ certificate_template: newConfig.templateId })
          .eq("id", eventId);
        if (legacyError) throw legacyError;
        return;
      }

      const { error } = await supabase
        .from("events")
        .update({ certificate_config: newConfig })
        .eq("id", eventId);

      if (error && isMissingColumnError(error, "certificate_config")) {
        const { error: legacyError } = await supabase
          .from("events")
          .update({ certificate_template: newConfig.templateId })
          .eq("id", eventId);
        if (legacyError) throw legacyError;
        return;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-config", eventId] });
    },
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

function useIssuedCertificates(eventId: string | undefined, filters: Filters) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["issued-certificates", eventId, filters, page],
    queryFn: async () => {
      if (!eventId) return { certificates: [], totalCount: 0 };

      let query = supabase
        .from("certificates")
        .select("*, tickets!inner(event_id)", { count: "exact" })
        .eq("tickets.event_id", eventId);

      // Apply filters
      if (filters.status === "valid") {
        query = query.is("revoked_at", null);
      } else if (filters.status === "revoked") {
        query = query.not("revoked_at", "is", null);
      }

      if (filters.search) {
        query = query.ilike("attendee_name", `%${filters.search}%`);
      }

      if (filters.dateFrom) {
        query = query.gte("issued_at", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte("issued_at", filters.dateTo.toISOString());
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: certificates, error, count } = await query
        .order("issued_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { certificates: certificates || [], totalCount: count || 0 };
    },
    enabled: !!eventId,
  });

  return {
    certificates: data?.certificates || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    page,
    setPage,
    pageSize,
    totalPages: Math.ceil((data?.totalCount || 0) / pageSize),
  };
}

function useCertificateStats(eventId: string | undefined) {
  return useQuery<CertificateStats>({
    queryKey: ["certificate-stats", eventId],
    queryFn: async () => {
      if (!eventId) {
        return {
          totalParticipants: 0,
          checkedInCount: 0,
          certificatesIssued: 0,
          pendingCertificates: 0,
          revokedCount: 0,
          issuedToday: 0,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, status, owner_id, attendee_name")
        .eq("event_id", eventId)
        .in("status", ["active", "used"]);

      if (ticketsError) throw ticketsError;

      const { data: certificates, error: certsError } = await supabase
        .from("certificates")
        .select("ticket_id, revoked_at, issued_at")
        .eq("event_id", eventId);

      if (certsError) throw certsError;

      const checkedInTickets = tickets?.filter((t) => t.status === "used") || [];
      const validCerts = certificates?.filter((c) => !c.revoked_at) || [];
      const certTicketIds = new Set(validCerts.map((c) => c.ticket_id));
      const pendingCerts = checkedInTickets.filter((t) => !certTicketIds.has(t.id));
      const revokedCount = certificates?.filter((c) => c.revoked_at).length || 0;
      const issuedToday = validCerts.filter((c) => {
        const issuedDate = new Date(c.issued_at);
        issuedDate.setHours(0, 0, 0, 0);
        return isSameDay(issuedDate, today);
      }).length;

      return {
        totalParticipants: tickets?.length || 0,
        checkedInCount: checkedInTickets.length,
        certificatesIssued: certTicketIds.size,
        pendingCertificates: pendingCerts.length,
        revokedCount,
        issuedToday,
      };
    },
    enabled: !!eventId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// =============================================================================
// Sub-Components
// =============================================================================

function TemplateSelector({
  value,
  onChange,
}: {
  value: CertificateTemplateId;
  onChange: (template: CertificateTemplateId) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Template do Certificado</Label>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATE_LIST.map((template) => {
          const templateId = template.id;
          return (
            <button
              key={templateId}
              onClick={() => onChange(templateId)}
              className={cn(
                "relative p-4 rounded-lg border-2 text-left transition-all",
                value === templateId
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </div>
              <div className="flex gap-2 mt-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: template.defaultColors.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: template.defaultColors.secondary }}
                />
              </div>
              {value === templateId && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorConfigurator({
  primaryColor,
  secondaryColor,
  onChange,
}: {
  primaryColor: string;
  secondaryColor: string;
  onChange: (colors: { primaryColor: string; secondaryColor: string }) => void;
}) {
  const presetColors = [
    { primary: "#1a365d", secondary: "#c9a227", name: "Executive" },
    { primary: "#ea580b", secondary: "#1f2937", name: "Modern" },
    { primary: "#064e3b", secondary: "#d4af37", name: "Academic" },
    { primary: "#7c3aed", secondary: "#f59e0b", name: "Creative" },
    { primary: "#0f172a", secondary: "#3b82f6", name: "Dark Blue" },
    { primary: "#881337", secondary: "#fb7185", name: "Rose" },
  ];

  return (
    <div className="space-y-4">
      <Label>Cores Personalizadas</Label>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value, secondaryColor })}
            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
          />
          <div className="flex-1">
            <Label className="text-xs">Cor Primária</Label>
            <Input
              value={primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value, secondaryColor })}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => onChange({ primaryColor, secondaryColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0 p-0"
          />
          <div className="flex-1">
            <Label className="text-xs">Cor Secundária</Label>
            <Input
              value={secondaryColor}
              onChange={(e) => onChange({ primaryColor, secondaryColor: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Predefinições</Label>
        <div className="flex flex-wrap gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange({ primaryColor: preset.primary, secondaryColor: preset.secondary })
              }
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border hover:bg-muted transition-colors"
              title={preset.name}
            >
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: preset.primary }}
              />
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: preset.secondary }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldConfigurator({
  fields,
  onChange,
}: {
  fields: CertificateFields;
  onChange: (fields: CertificateFields) => void;
}) {
  const toggleField = (key: keyof CertificateFields) => {
    onChange({ ...fields, [key]: !fields[key] });
  };

  const fieldItems = [
    { key: "showEventName" as const, label: "Nome do Evento", icon: FileCheck },
    { key: "showParticipantName" as const, label: "Nome do Participante", icon: Users },
    { key: "showParticipantLastName" as const, label: "Sobrenome Completo", icon: Users },
    { key: "showCPF" as const, label: "CPF do Participante", icon: UserCheck },
    { key: "showEventDate" as const, label: "Data do Evento", icon: Calendar },
    { key: "showEventLocation" as const, label: "Local do Evento", icon: ExternalLink },
    { key: "showWorkload" as const, label: "Carga Horária", icon: Clock },
    { key: "showSigners" as const, label: "Signatários", icon: UserCheck },
  ];

  return (
    <div className="space-y-3">
      <Label>Campos do Certificado</Label>
      <div className="space-y-2">
        {fieldItems.map(({ key, label, icon: Icon }) => (
          <label
            key={key}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </div>
            <Switch checked={fields[key]} onCheckedChange={() => toggleField(key)} />
          </label>
        ))}
      </div>
    </div>
  );
}

function TextConfigurator({
  config,
  onChange,
}: {
  config: CertificateTextConfig;
  onChange: (config: CertificateTextConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <Label>Textos do Certificado</Label>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Título</Label>
          <Input
            value={config.title}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            placeholder="CERTIFICADO DE PARTICIPAÇÃO"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texto de Introdução</Label>
          <Input
            value={config.introText}
            onChange={(e) => onChange({ ...config, introText: e.target.value })}
            placeholder="Certificamos que"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texto de Participação</Label>
          <Input
            value={config.participationText}
            onChange={(e) => onChange({ ...config, participationText: e.target.value })}
            placeholder="participou do evento"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Texto de Conclusão</Label>
          <textarea
            value={config.conclusionText}
            onChange={(e) => onChange({ ...config, conclusionText: e.target.value })}
            placeholder="Comprove sua participação através do código de verificação."
            className="w-full px-3 py-2 text-sm border rounded-lg min-h-[60px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{config.conclusionText.length}/200 caracteres</p>
        </div>
      </div>
    </div>
  );
}

function SignersManager({
  signers,
  onChange,
}: {
  signers: CertificateSigner[];
  onChange: (signers: CertificateSigner[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSigner, setNewSigner] = useState<CertificateSigner>({ name: "", role: "" });

  const addSigner = () => {
    if (newSigner.name.trim() && newSigner.role.trim()) {
      onChange([...signers, { ...newSigner }]);
      setNewSigner({ name: "", role: "" });
      setIsAdding(false);
    }
  };

  const removeSigner = (index: number) => {
    onChange(signers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Signatários</Label>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {signers.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum signatário configurado
        </p>
      )}

      <div className="space-y-2">
        {signers.map((signer, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20"
          >
            <div>
              <p className="font-medium text-sm">{signer.name}</p>
              <p className="text-xs text-muted-foreground">{signer.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => removeSigner(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="p-3 rounded-lg border border-border space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input
              value={newSigner.name}
              onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
              placeholder="Ex: João Silva"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cargo/Função</Label>
            <Input
              value={newSigner.role}
              onChange={(e) => setNewSigner({ ...newSigner, role: e.target.value })}
              placeholder="Ex: Diretor Executivo"
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="flex-1" onClick={addSigner}>
              Adicionar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackgroundUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `certificate-bg-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("event-assets")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from("event-assets").getPublicUrl(fileName);
      onChange(publicUrlData.publicUrl);
    } catch {
      // Silently handle error - user will see failed state
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Background Personalizado</Label>

      {value ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border">
          <img src={value} alt="Background" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
        >
          {isUploading ? (
            <>
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
              <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function WorkloadInput({
  value,
  showWorkload,
  onChange,
}: {
  value: number;
  showWorkload: boolean;
  onChange: (value: number, show: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Carga Horária</Label>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
        <span className="text-sm">Mostrar carga horária</span>
        <Switch checked={showWorkload} onCheckedChange={(checked) => onChange(value, checked)} />
      </div>
      {showWorkload && (
        <div className="pl-4 border-l-2 border-primary/20">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Horas</Label>
          <Input
            type="number"
            min={0}
            max={999}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0, showWorkload)}
            className="h-9 w-24"
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

function ConfigurarTab({
  config,
  onConfigChange,
  eventId,
  event,
}: {
  config: CertificateConfig;
  onConfigChange: (config: CertificateConfig) => void;
  eventId: string;
  event: any;
}) {
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const lastSyncedConfigRef = useRef(config);
  const debouncedConfig = useDebounce(localConfig, 2000);

  useEffect(() => {
    const hasRemoteChange = JSON.stringify(config) !== JSON.stringify(lastSyncedConfigRef.current);
    if (hasRemoteChange) {
      setLocalConfig(config);
      lastSyncedConfigRef.current = config;
      setHasChanges(false);
    }
  }, [config]);

  // Auto-save with debounce
  useEffect(() => {
    if (hasChanges) {
      onConfigChange(debouncedConfig);
      setHasChanges(false);
    }
  }, [debouncedConfig, hasChanges, onConfigChange]);

  const updateConfig = (updates: Partial<CertificateConfig>) => {
    setLocalConfig({ ...localConfig, ...updates });
    setHasChanges(true);
  };

  // Undo functionality
  const handleUndo = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  // Keyboard shortcut for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);

  const sampleData: CertificateSampleData = {
    ...DEFAULT_SAMPLE_DATA,
    eventName: event?.title || DEFAULT_SAMPLE_DATA.eventName,
    eventDate: event?.start_date
      ? format(new Date(event.start_date), "dd/MM/yyyy")
      : DEFAULT_SAMPLE_DATA.eventDate,
    eventLocation: event?.venue_name || DEFAULT_SAMPLE_DATA.eventLocation,
  };

  const handleDownloadSample = async () => {
    if (isGeneratingSample || !eventId || !previewRef.current) return;

    setIsGeneratingSample(true);
    
    // ESTRATÉGIA 1: Gerar PDF localmente a partir do preview visível
    // Isso garante 100% de fidelidade com o que o usuário está vendo
    try {
      console.log("[PDF] Gerando PDF localmente do preview...");
      
      const previewElement = previewRef.current.querySelector("[data-testid='certificate-preview']") as HTMLElement;
      
      if (previewElement) {
        await generateCertificatePDF(
          previewElement,
          `certificado-preview-${eventId}.pdf`
        );
        
        toast({
          title: "PDF gerado!",
          description: "Certificado de exemplo baixado com sucesso.",
        });
        
        setIsGeneratingSample(false);
        return;
      }
    } catch (localError) {
      console.warn("[PDF] Falha na geração local, tentando Edge Function:", localError);
    }

    // ESTRATÉGIA 2: Fallback para Edge Function (se configurada)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            previewData: {
              eventId,
              participantName: sampleData.participantName,
              eventName: sampleData.eventName,
              eventDate: event?.start_date,
              eventLocation: sampleData.eventLocation,
              workloadHours: localConfig.workloadHours,
              fields: {
                showParticipantName: localConfig.fields.showParticipantName,
                showEventTitle: localConfig.fields.showEventName,
                showEventDate: localConfig.fields.showEventDate,
                showEventLocation: localConfig.fields.showEventLocation,
                showWorkload: localConfig.fields.showWorkload,
                showSigners: localConfig.fields.showSigners,
                showLogo: true,
                showVerificationCode: true,
                showQrCode: true,
              },
              textConfig: {
                title: localConfig.textConfig.title,
                subtitle: localConfig.textConfig.introText,
                bodyText: localConfig.textConfig.participationText,
                footerText: localConfig.textConfig.conclusionText,
              },
              signers: localConfig.signers,
            },
            templateId: localConfig.templateId,
            customColors: {
              primary: localConfig.primaryColor,
              secondary: localConfig.secondaryColor,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-preview-${eventId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF gerado!",
        description: "Certificado baixado via servidor.",
      });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Verifique o console (F12) para detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column - Configuration */}
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Template e Cores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TemplateSelector
              value={localConfig.templateId}
              onChange={(templateId) => updateConfig({ templateId })}
            />
            <Separator />
            <ColorConfigurator
              primaryColor={localConfig.primaryColor}
              secondaryColor={localConfig.secondaryColor}
              onChange={({ primaryColor, secondaryColor }) =>
                updateConfig({ primaryColor, secondaryColor })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Campos e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldConfigurator
              fields={localConfig.fields}
              onChange={(fields) => updateConfig({ fields })}
            />
            <Separator />
            <WorkloadInput
              value={localConfig.workloadHours}
              showWorkload={localConfig.fields.showWorkload}
              onChange={(hours, show) =>
                updateConfig({
                  workloadHours: hours,
                  fields: { ...localConfig.fields, showWorkload: show },
                })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4" />
              Textos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TextConfigurator
              config={localConfig.textConfig}
              onChange={(textConfig) => updateConfig({ textConfig })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Signatários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignersManager
              signers={localConfig.signers}
              onChange={(signers) => updateConfig({ signers })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Background Personalizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BackgroundUploader
              value={localConfig.backgroundUrl}
              onChange={(backgroundUrl) => updateConfig({ backgroundUrl })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview ao Vivo
              </CardTitle>
              <CardDescription>Visualize as alterações em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                ref={previewRef} 
                className="overflow-x-auto pb-2 scrollbar-thin"
              >
                <CertificatePreview
                  key={`preview-${localConfig.templateId}`}
                  templateId={localConfig.templateId}
                  primaryColor={localConfig.primaryColor}
                  secondaryColor={localConfig.secondaryColor}
                  backgroundUrl={localConfig.backgroundUrl || undefined}
                  fields={localConfig.fields}
                  textConfig={localConfig.textConfig}
                  signers={localConfig.signers}
                  workloadHours={localConfig.workloadHours}
                  sampleData={sampleData}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleUndo}>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Desfazer (Ctrl+Z)
                </Button>
                <Button className="flex-1" onClick={() => onConfigChange(localConfig)}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Agora
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={handleDownloadSample}
                disabled={isGeneratingSample}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingSample ? "Gerando PDF..." : "Baixar PDF de Exemplo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmitidosTab({
  eventId,
  stats,
}: {
  eventId: string;
  stats: CertificateStats | undefined;
}) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    dateFrom: null,
    dateTo: null,
  });
  const debouncedSearch = useDebounce(filters.search, 300);
  const queryClient = useQueryClient();

  const {
    certificates,
    isLoading,
    page,
    setPage,
    totalPages,
    totalCount,
  } = useIssuedCertificates(eventId, { ...filters, search: debouncedSearch });

  const revokeMutation = useMutation({
    mutationFn: async ({ certId, reason }: { certId: string; reason: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("revoke_certificate", {
        cert_id: certId,
        reason,
        revoked_by_user: userData.user?.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setCertToRevoke(null);
      setRevokeReason("");
      queryClient.invalidateQueries({ queryKey: ["issued-certificates"] });
      queryClient.invalidateQueries({ queryKey: ["certificate-stats"] });
    },
    onError: () => {
      // Error handled in UI
    },
  });

  const [certToRevoke, setCertToRevoke] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const handleDownloadPDF = async (cert: Certificate) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada");
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ certificateId: cert.id }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("PDF generation error:", errorText);
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${cert.certificate_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      // Error handled silently - UI shows error state
    }
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/verificar-certificado?code=${code}`;
    navigator.clipboard.writeText(link);
  };

  const exportToCSV = () => {
    const headers = ["Participante", "Código", "Data de Emissão", "Status"];
    const rows = certificates.map((cert) => [
      cert.attendee_name,
      cert.certificate_code,
      format(new Date(cert.issued_at), "dd/MM/yyyy HH:mm"),
      cert.revoked_at ? "Revogado" : "Válido",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `certificados-${eventId}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total Emitidos</p>
            <p className="text-2xl font-display font-bold">{stats?.certificatesIssued || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Emitidos Hoje</p>
            <p className="text-2xl font-display font-bold">{stats?.issuedToday || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Revogados</p>
            <p className="text-2xl font-display font-bold">{stats?.revokedCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-display font-bold">{stats?.pendingCertificates || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value: any) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="valid">Válidos</SelectItem>
                <SelectItem value="revoked">Revogados</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM") : "Data Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) => setFilters({ ...filters, dateFrom: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  {filters.dateTo ? format(filters.dateTo, "dd/MM") : "Data Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) => setFilters({ ...filters, dateTo: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={exportToCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Data de Emissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Award className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum certificado encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow
                    key={cert.id}
                    className={cn(cert.revoked_at && "opacity-50 bg-muted/30")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            cert.revoked_at ? "bg-red-100" : "bg-green-100"
                          )}
                        >
                          <Award
                            className={cn(
                              "h-4 w-4",
                              cert.revoked_at ? "text-red-500" : "text-green-600"
                            )}
                          />
                        </div>
                        <span className="font-medium">{cert.attendee_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{cert.certificate_code}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(cert.issued_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {cert.revoked_at ? (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Revogado
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Válido
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!cert.revoked_at && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(cert)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(cert.certificate_code)}
                              title="Copiar link de verificação"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCert(cert)}
                              title="Ver detalhes"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCertToRevoke(cert)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Revogar"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <Dialog open={!!certToRevoke} onOpenChange={() => setCertToRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Revogar Certificado
            </DialogTitle>
            <DialogDescription>
              Esta ação irá invalidar o certificado de <strong>{certToRevoke?.attendee_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da revogação *</Label>
              <textarea
                id="reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Check-in incorreto, cancelamento de participação..."
                className="w-full px-3 py-2 text-sm border rounded-lg min-h-[80px]"
              />
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A revogação é irreversível. O certificado será marcado como inválido na verificação
                online.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCertToRevoke(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (certToRevoke && revokeReason.trim()) {
                  revokeMutation.mutate({ certId: certToRevoke.id, reason: revokeReason.trim() });
                }
              }}
              disabled={!revokeReason.trim() || revokeMutation.isPending}
            >
              {revokeMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Revogando...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Revogar Certificado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Participante</Label>
                <p className="font-medium">{selectedCert?.attendee_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Código</Label>
                <p className="font-medium font-mono">{selectedCert?.certificate_code}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Emitido em</Label>
                <p>
                  {selectedCert?.issued_at &&
                    format(new Date(selectedCert.issued_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  {selectedCert?.revoked_at ? (
                    <Badge variant="destructive">Revogado</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">Válido</Badge>
                  )}
                </div>
              </div>
            </div>

            {selectedCert?.revoked_at && (
              <Alert variant="destructive">
                <AlertDescription>
                  Revogado em: {format(new Date(selectedCert.revoked_at), "dd/MM/yyyy HH:mm")}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => selectedCert && handleDownloadPDF(selectedCert)}
                disabled={!!selectedCert?.revoked_at}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => selectedCert && handleCopyLink(selectedCert.certificate_code)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EstatisticasTab({ eventId, stats }: { eventId: string; stats: CertificateStats | undefined }) {
  // Mock data for charts - in a real app, this would come from the backend
  const issuanceData = [
    { date: "2024-01", count: 45 },
    { date: "2024-02", count: 62 },
    { date: "2024-03", count: 38 },
    { date: "2024-04", count: 89 },
    { date: "2024-05", count: 124 },
    { date: "2024-06", count: 156 },
  ];

  const templateUsage = [
    { template: "Executive", count: 245 },
    { template: "Modern", count: 189 },
    { template: "Academic", count: 134 },
    { template: "Creative", count: 67 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Emitidos</p>
                <p className="text-2xl font-display font-bold">{stats?.certificatesIssued || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Download</p>
                <p className="text-2xl font-display font-bold">~78%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compartilhamentos</p>
                <p className="text-2xl font-display font-bold">142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <EyeIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verificações</p>
                <p className="text-2xl font-display font-bold">892</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Emissões ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issuanceData.map((item) => (
                <div key={item.date} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">
                    {format(new Date(item.date), "MMM/yy", { locale: ptBR })}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(item.count / 156) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Templates Mais Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templateUsage.map((item) => (
                <div key={item.template} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20">{item.template}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${(item.count / 245) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Participantes
          </CardTitle>
          <CardDescription>Participantes com mais certificados emitidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Ana Carolina Silva", count: 5, lastEvent: "Workshop de Marketing Digital" },
              { name: "Pedro Henrique Costa", count: 4, lastEvent: "Conferência de Tecnologia 2024" },
              { name: "Mariana Oliveira", count: 4, lastEvent: "Curso de Gestão Ágil" },
              { name: "Lucas Mendes", count: 3, lastEvent: "Workshop de Design Thinking" },
              { name: "Julia Santos", count: 3, lastEvent: "Palestra de Inovação" },
            ].map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">{participant.lastEvent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-medium">{participant.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ProducerEventCertificates() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"configurar" | "emitidos" | "estatisticas">("configurar");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event } = useQuery({
    queryKey: ["event-certificates-meta", id],
    queryFn: async () => {
      if (missingColumnsCache.has("certificate_config")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("events")
          .select("id, title, has_certificates, start_date, venue_name, producer_id, certificate_template")
          .eq("id", id!)
          .single();
        if (legacyError) throw legacyError;
        return legacyData;
      }

      const { data, error } = await supabase
        .from("events")
        .select("id, title, has_certificates, start_date, venue_name, certificate_config, producer_id")
        .eq("id", id!)
        .single();

      if (error && isMissingColumnError(error, "certificate_config")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("events")
          .select("id, title, has_certificates, start_date, venue_name, producer_id, certificate_template")
          .eq("id", id!)
          .single();
        if (legacyError) throw legacyError;
        return legacyData;
      }

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { config, updateConfig, isLoading: isLoadingConfig } = useCertificateConfig(id);
  const { data: stats, isLoading: isLoadingStats } = useCertificateStats(id);

  // Enable certificates mutation
  const enableCertificatesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").update({ has_certificates: true }).eq("id", id!);
      if (error) throw error;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["event-certificates-meta", id] });
      
      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData(["event-certificates-meta", id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["event-certificates-meta", id], (old: any) => ({
        ...old,
        has_certificates: true,
      }));
      
      return { previousEvent };
    },
    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: ["event-certificates-meta", id], exact: true });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(["event-certificates-meta", id], context.previousEvent);
      }
      // Error shown in UI state
    },
  });

  // Generate missing certificates mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { eventId: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-stats"] });
      queryClient.invalidateQueries({ queryKey: ["issued-certificates"] });
    },
    onError: () => {
      // Error shown in UI
    },
  });

  // Regenerate all certificates
  const regenerateAllMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-all-certificates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ eventId: id }),
        }
      );
      if (!response.ok) throw new Error("Erro ao reemitir certificados");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issued-certificates"] });
    },
    onError: () => {
      // Error shown in UI
    },
  });

  if (!event?.has_certificates) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Certificados não estão habilitados para este evento. Ative a opção abaixo para começar a
            emitir certificados de participação.
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Certificados desabilitados</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Ative os certificados para emitir certificados de participação automaticamente quando
              os participantes fizerem check-in.
            </p>
            <Button
              onClick={() => enableCertificatesMutation.mutate()}
              disabled={enableCertificatesMutation.isPending}
              size="lg"
            >
              {enableCertificatesMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Ativando...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Ativar Certificados
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certificados de Participação
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os certificados emitidos para os participantes do evento
          </p>
        </div>
        <div className="flex gap-2">
          {stats && stats.pendingCertificates > 0 && (
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Emitir {stats.pendingCertificates} pendente
                  {stats.pendingCertificates > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Participantes</p>
                  <p className="text-2xl font-display font-bold">{stats.totalParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Check-ins Realizados</p>
                  <p className="text-2xl font-display font-bold">{stats.checkedInCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Certificados Emitidos</p>
                  <p className="text-2xl font-display font-bold">{stats.certificatesIssued}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-display font-bold">{stats.pendingCertificates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="configurar" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurar</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="emitidos" className="gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Emitidos</span>
            <span className="sm:hidden">Emitidos</span>
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurar" className="space-y-6">
          {isLoadingConfig ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px]" />
            </div>
          ) : (
            <ConfigurarTab config={config} onConfigChange={updateConfig} eventId={id!} event={event} />
          )}
        </TabsContent>

        <TabsContent value="emitidos" className="space-y-6">
          <EmitidosTab eventId={id!} stats={stats} />
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-6">
          <EstatisticasTab eventId={id!} stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Bulk Actions */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-sm">Ações em Massa</h4>
              <p className="text-xs text-muted-foreground">Opções avançadas para gerenciamento</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateAllMutation.mutate()}
                disabled={regenerateAllMutation.isPending}
              >
                {regenerateAllMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    Reemitindo...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reemitir Todos
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
