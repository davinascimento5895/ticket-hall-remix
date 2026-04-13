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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { generateCertificatePDF } from "@/lib/certificate-pdf-client";
import { BackgroundUploader } from "@/components/certificates/BackgroundUploader";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  CertificateTextPositions,
  CertificateFontSizes,
} from "@/components/certificates/CertificatePreview";
import { TextPositionControls } from "@/components/certificates/TextPositionControls";
import { FieldConfigurator } from "@/components/certificates/FieldConfigurator";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// =============================================================================
// Types & Interfaces
// =============================================================================

interface CertificateConfig {
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  backgroundUrl: string | null;
  workloadHours: number;
  textColor: string;
  textPositions: CertificateTextPositions;
  fontSizes: CertificateFontSizes;
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

interface DailyIssuance {
  label: string;
  count: number;
}

interface TopParticipant {
  name: string;
  count: number;
  lastIssuedAt: string;
}

interface CertificateAnalytics {
  issuanceByDay: DailyIssuance[];
  topParticipants: TopParticipant[];
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
  fields: {
    showEventName: true,
    showParticipantName: true,
    showParticipantLastName: true,
    showCPF: false,
    maskCPF: false,
    showEventDate: true,
    showEventTime: false,
    showEventLocation: true,
    showWorkload: false,
    showSigners: true,
    showQRCode: true,
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
  textColor: "#1f2937",
  textPositions: {
    titleTop: 8,
    nameTop: 28,
    metadataTop: 55,
  },
  fontSizes: {
    title: "xl",
    name: "4xl",
    event: "2xl",
  },
};

const DEFAULT_SAMPLE_DATA: CertificateSampleData = {
  eventName: "Nome do Evento",
  participantName: "Maria Silva",
  participantCPF: "123.456.789-00",
  eventDate: format(new Date(), "dd/MM/yyyy"),
  eventLocation: "São Paulo, SP",
  certificateCode: "CERT-XXXX-XXXXXXXX-XXX",
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

const isSchemaMissingError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    err.code === "PGRST204" ||
    err.code === "PGRST116" ||
    (msg.includes("column") && msg.includes("not found")) ||
    (msg.includes("relation") && msg.includes("not found")) ||
    msg.includes("does not exist")
  );
};

const configFromLegacy = (): CertificateConfig => {
  return { ...DEFAULT_CONFIG };
};

// =============================================================================
// Custom Hooks
// =============================================================================

function useCertificateConfig(eventId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const hasShownSchemaToastRef = useRef(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["certificate-config", eventId],
    queryFn: async () => {
      if (!eventId) return DEFAULT_CONFIG;

      const { data, error } = await supabase
        .from("events")
        .select("certificate_config")
        .eq("id", eventId)
        .single();

      if (error && isMissingColumnError(error, "certificate_config")) {
        const msg = "Coluna certificate_config não disponível no banco de dados. Execute as migrações do Supabase.";
        setSchemaError(msg);
        if (!hasShownSchemaToastRef.current) {
          hasShownSchemaToastRef.current = true;
          toast({
            title: "Sistema de certificados não configurado",
            description: msg,
            variant: "destructive",
          });
        }
        return configFromLegacy();
      }

      if (error) throw error;

      // Se a consulta funcionou, limpa qualquer marcação antiga de coluna ausente.
      missingColumnsCache.delete("certificate_config");
      setSchemaError(null);
      hasShownSchemaToastRef.current = false;

      return data?.certificate_config
        ? { ...DEFAULT_CONFIG, ...(data.certificate_config as Partial<CertificateConfig>) }
        : configFromLegacy();
    },
    enabled: !!eventId,
    retry: (failureCount, error) => {
      if (isSchemaMissingError(error)) return false;
      return failureCount < 2;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: CertificateConfig) => {
      if (!eventId) throw new Error("Event ID required");
      if (missingColumnsCache.has("certificate_config")) {
        throw new Error("Coluna certificate_config não disponível no banco de dados. Execute as migrações do Supabase.");
      }

      const { data, error } = await supabase
        .from("events")
        .update({ certificate_config: newConfig as any })
        .eq("id", eventId)
        .select("certificate_config")
        .single();

      if (error && isMissingColumnError(error, "certificate_config")) {
        throw new Error("Coluna certificate_config não disponível no banco de dados. Execute as migrações do Supabase.");
      }

      if (error) throw error;
      if (!data) {
        throw new Error(
          "Nenhuma linha foi atualizada. Possíveis causas: permissão negada (RLS), o evento não existe ou o ID está incorreto."
        );
      }

      // Se o update funcionou, limpa qualquer marcação antiga de coluna ausente.
      missingColumnsCache.delete("certificate_config");
      setSchemaError(null);
      hasShownSchemaToastRef.current = false;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-config", eventId] });
      toast({ title: "Configuração salva", description: "As alterações do certificado foram salvas com sucesso." });
    },
    onError: (err) => {
      const msg = (err as Error).message || "";
      if (missingColumnsCache.has("certificate_config")) {
        // já reportado no banner/toast único; não spammar
        return;
      }
      if (isSchemaMissingError(err)) {
        toast({
          title: "Sistema de certificados não configurado",
          description: "O banco de dados ainda não possui as colunas necessárias (certificate_config, has_certificates, etc.). Execute as migrações do Supabase.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
      }
    },
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    schemaError,
    clearSchemaError: () => {
      setSchemaError(null);
      hasShownSchemaToastRef.current = false;
      missingColumnsCache.delete("certificate_config");
    },
  };
}

function useIssuedCertificates(eventId: string | undefined, filters: Filters) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["issued-certificates", eventId, filters, page],
    queryFn: async () => {
      if (!eventId) return { certificates: [], totalCount: 0 };

      try {
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
      } catch (err) {
        if (isSchemaMissingError(err)) {
          return { certificates: [], totalCount: 0 };
        }
        throw err;
      }
    },
    enabled: !!eventId,
    retry: (failureCount, error) => {
      if (isSchemaMissingError(error)) return false;
      return failureCount < 2;
    },
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

      try {
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
      } catch (err) {
        if (isSchemaMissingError(err)) {
          return {
            totalParticipants: 0,
            checkedInCount: 0,
            certificatesIssued: 0,
            pendingCertificates: 0,
            revokedCount: 0,
            issuedToday: 0,
          };
        }
        throw err;
      }
    },
    enabled: !!eventId,
    retry: (failureCount, error) => {
      if (isSchemaMissingError(error)) return false;
      return failureCount < 2;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

function useCertificateAnalytics(eventId: string | undefined) {
  return useQuery<CertificateAnalytics>({
    queryKey: ["certificate-analytics", eventId],
    queryFn: async () => {
      if (!eventId) {
        return { issuanceByDay: [], topParticipants: [] };
      }

      const { data: certificates, error } = await supabase
        .from("certificates")
        .select("attendee_name, issued_at, revoked_at")
        .eq("event_id", eventId)
        .order("issued_at", { ascending: false });

      if (error) throw error;

      const validCertificates = (certificates || []).filter((c) => !c.revoked_at);
      const byDay = new Map<string, number>();

      validCertificates.forEach((cert) => {
        const key = format(new Date(cert.issued_at), "dd/MM");
        byDay.set(key, (byDay.get(key) || 0) + 1);
      });

      const issuanceByDay = Array.from(byDay.entries())
        .slice(-14)
        .map(([label, count]) => ({ label, count }));

      const byParticipant = new Map<string, { count: number; lastIssuedAt: string }>();
      validCertificates.forEach((cert) => {
        const current = byParticipant.get(cert.attendee_name);
        if (!current) {
          byParticipant.set(cert.attendee_name, { count: 1, lastIssuedAt: cert.issued_at });
          return;
        }

        byParticipant.set(cert.attendee_name, {
          count: current.count + 1,
          lastIssuedAt: isAfter(new Date(cert.issued_at), new Date(current.lastIssuedAt))
            ? cert.issued_at
            : current.lastIssuedAt,
        });
      });

      const topParticipants = Array.from(byParticipant.entries())
        .map(([name, data]) => ({ name, count: data.count, lastIssuedAt: data.lastIssuedAt }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        issuanceByDay,
        topParticipants,
      };
    },
    enabled: !!eventId,
    retry: (failureCount, error) => {
      if (isSchemaMissingError(error)) return false;
      return failureCount < 2;
    },
    refetchInterval: 30000,
  });
}

// =============================================================================
// Sub-Components
// =============================================================================

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
              className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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

// =============================================================================
// Tab Components
// =============================================================================

function ConfigurarTab({
  config,
  onConfigChange,
  eventId,
  event,
  schemaError,
  clearSchemaError,
}: {
  config: CertificateConfig;
  onConfigChange: (config: CertificateConfig) => void;
  eventId: string;
  event: any;
  schemaError: string | null;
  clearSchemaError: () => void;
}) {
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const desktopPreviewRef = useRef<HTMLDivElement>(null);
  const mobilePreviewRef = useRef<HTMLDivElement>(null);
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

  const sampleData: CertificateSampleData = {
    ...DEFAULT_SAMPLE_DATA,
    eventName: event?.title || DEFAULT_SAMPLE_DATA.eventName,
    eventDate: event?.start_date
      ? format(new Date(event.start_date), "dd/MM/yyyy")
      : DEFAULT_SAMPLE_DATA.eventDate,
    eventTime: event?.start_date
      ? format(new Date(event.start_date), "HH:mm")
      : undefined,
    eventLocation: event?.venue_name || DEFAULT_SAMPLE_DATA.eventLocation,
  };

  const normalizedFields = { ...DEFAULT_CONFIG.fields, ...localConfig.fields } as any;

  const handleDownloadSample = async () => {
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const previewContainer = isMobile ? mobilePreviewRef.current : desktopPreviewRef.current;
    if (isGeneratingSample || !eventId || !previewContainer) return;

    setIsGeneratingSample(true);
    try {
      const previewElement = previewContainer.querySelector("[data-testid='certificate-preview']") as HTMLElement;
      if (previewElement) {
        await generateCertificatePDF(previewElement, `certificado-preview-${eventId}.pdf`);
        toast({
          title: "PDF gerado!",
          description: "Certificado de exemplo baixado com sucesso.",
        });
      }
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
    <div className="space-y-4 overflow-x-hidden">
      {schemaError && (
        <Alert className="animate-in fade-in slide-in-from-top-2 border-orange-300/60 bg-orange-50/70 dark:bg-orange-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>Configuração indisponível no banco de dados para este evento.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSchemaError}>
                Ocultar aviso
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="lg:hidden space-y-4">
        <Card className="overflow-hidden border-border/60 bg-zinc-950 text-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4 text-orange-400" />
                  Pré-visualização
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Salvamento automático ativo
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                onClick={handleDownloadSample}
                disabled={isGeneratingSample}
              >
                {isGeneratingSample ? "PDF..." : "PDF"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              ref={mobilePreviewRef}
              className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-2"
            >
              <CertificatePreview
                backgroundUrl={localConfig.backgroundUrl || undefined}
                fields={normalizedFields}
                textConfig={localConfig.textConfig}
                signers={localConfig.signers}
                workloadHours={localConfig.workloadHours}
                sampleData={sampleData}
                textColor={localConfig.textColor}
                textPositions={localConfig.textPositions}
                fontSizes={localConfig.fontSizes}
                mode="producer"
                className="w-full"
              />
            </div>
            <p className="text-center text-[11px] text-zinc-400">
              {hasChanges ? "Salvando automaticamente..." : "Alterações salvas automaticamente"}
            </p>
          </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={["fundo", "textos", "campos", "assinantes"]} className="space-y-3">
          <AccordionItem value="fundo" className="overflow-hidden rounded-2xl border border-border/60 border-b-0 bg-card px-4">
            <AccordionTrigger className="py-4 text-sm hover:no-underline">
              Imagem de fundo
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <BackgroundUploader
                backgroundUrl={localConfig.backgroundUrl}
                onUpload={(url) => updateConfig({ backgroundUrl: url })}
                onRemove={() => updateConfig({ backgroundUrl: null })}
                compact
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="textos" className="overflow-hidden rounded-2xl border border-border/60 border-b-0 bg-card px-4">
            <AccordionTrigger className="py-4 text-sm hover:no-underline">
              Textos e posição
            </AccordionTrigger>
            <AccordionContent className="space-y-5">
              <TextConfigurator
                config={localConfig.textConfig}
                onChange={(textConfig) => updateConfig({ textConfig })}
              />
              <TextPositionControls
                textColor={localConfig.textColor}
                textPositions={localConfig.textPositions}
                fontSizes={localConfig.fontSizes}
                onChange={({ textColor, textPositions, fontSizes }) =>
                  updateConfig({
                    ...(textColor !== undefined && { textColor }),
                    ...(textPositions !== undefined && { textPositions }),
                    ...(fontSizes !== undefined && { fontSizes }),
                  })
                }
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="campos" className="overflow-hidden rounded-2xl border border-border/60 border-b-0 bg-card px-4">
            <AccordionTrigger className="py-4 text-sm hover:no-underline">
              Campos e carga horária
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <FieldConfigurator
                fields={normalizedFields}
                workloadHours={localConfig.workloadHours}
                onChange={(fields) => updateConfig({ fields })}
                onWorkloadChange={(hours) => updateConfig({ workloadHours: hours })}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assinantes" className="overflow-hidden rounded-2xl border border-border/60 border-b-0 bg-card px-4">
            <AccordionTrigger className="py-4 text-sm hover:no-underline">
              Assinaturas
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <SignersManager
                signers={localConfig.signers}
                onChange={(signers) => updateConfig({ signers })}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="border-border/60 bg-card">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Estado</span>
              <span>{hasChanges ? "Salvando..." : "Salvo automaticamente"}</span>
            </div>
            <Button
              className="w-full bg-orange-500 text-black hover:bg-orange-400"
              onClick={handleDownloadSample}
              disabled={isGeneratingSample}
            >
              {isGeneratingSample ? "Gerando PDF..." : "Baixar PDF de exemplo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 overflow-x-hidden">
      {/* Left Column - Configuration */}
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagem de Fundo (PNG)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BackgroundUploader
              backgroundUrl={localConfig.backgroundUrl}
              onUpload={(url) => updateConfig({ backgroundUrl: url })}
              onRemove={() => updateConfig({ backgroundUrl: null })}
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
              <Palette className="h-4 w-4" />
              Posição e Aparência dos Textos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TextPositionControls
              textColor={localConfig.textColor}
              textPositions={localConfig.textPositions}
              fontSizes={localConfig.fontSizes}
              onChange={({ textColor, textPositions, fontSizes }) =>
                updateConfig({
                  ...(textColor !== undefined && { textColor }),
                  ...(textPositions !== undefined && { textPositions }),
                  ...(fontSizes !== undefined && { fontSizes }),
                })
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
              fields={normalizedFields}
              workloadHours={localConfig.workloadHours}
              onChange={(fields) => updateConfig({ fields })}
              onWorkloadChange={(hours) => updateConfig({ workloadHours: hours })}
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
      </div>

      {/* Right Column - Preview */}
      <div className="lg:col-span-2">
        <div className="sticky top-4 space-y-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </CardTitle>
              <CardDescription>
                {hasChanges ? "Salvando automaticamente..." : "Alterações salvas automaticamente"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                ref={desktopPreviewRef}
                className="overflow-hidden pb-2"
              >
                <CertificatePreview
                  backgroundUrl={localConfig.backgroundUrl || undefined}
                  fields={normalizedFields}
                  textConfig={localConfig.textConfig}
                  signers={localConfig.signers}
                  workloadHours={localConfig.workloadHours}
                  sampleData={sampleData}
                  textColor={localConfig.textColor}
                  textPositions={localConfig.textPositions}
                  fontSizes={localConfig.fontSizes}
                  mode="producer"
                />
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
    </div>
  );
}

function EmitidosTab({
  eventId,
  stats,
  eventConfig,
  event,
}: {
  eventId: string;
  stats: CertificateStats | undefined;
  eventConfig: CertificateConfig;
  event: any;
}) {
  const { toast } = useToast();
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
      const { data, error } = await (supabase as any).rpc("revoke_certificate", {
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
    onError: (err) => {
      toast({
        title: "Erro ao revogar",
        description: (err as Error).message || "Não foi possível revogar o certificado.",
        variant: "destructive",
      });
    },
  });

  const [certToRevoke, setCertToRevoke] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const [downloadingCert, setDownloadingCert] = useState<Certificate | null>(null);
  const hiddenPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!downloadingCert || !hiddenPreviewRef.current) return;

    const run = async () => {
      try {
        const previewEl = hiddenPreviewRef.current!.querySelector("[data-testid='certificate-preview']") as HTMLElement;
        if (previewEl) {
          await generateCertificatePDF(previewEl, `certificado-${downloadingCert.certificate_code}.pdf`);
        }
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setDownloadingCert(null);
      }
    };

    const timer = setTimeout(run, 100);
    return () => clearTimeout(timer);
  }, [downloadingCert]);

  const handleDownloadPDF = async (cert: Certificate) => {
    if (!eventConfig.backgroundUrl) {
      toast({
        title: "Certificado indisponível",
        description: "O organizador ainda não configurou a imagem de fundo do certificado.",
        variant: "destructive",
      });
      return;
    }
    setDownloadingCert(cert);
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
          <div className="hidden md:block overflow-hidden">
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
                              cert.revoked_at ? "bg-zinc-200" : "bg-orange-100"
                            )}
                          >
                            <Award
                              className={cn(
                                "h-4 w-4",
                                cert.revoked_at ? "text-zinc-500" : "text-orange-600"
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
                          <Badge className="bg-zinc-600 text-white hover:bg-zinc-600">
                            <Ban className="h-3 w-3 mr-1" />
                            Revogado
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
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
                                title="Baixar PDF"
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
                                className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
          </div>

          <div className="md:hidden divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))
            ) : certificates.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Award className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum certificado encontrado</p>
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cert.attendee_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cert.certificate_code}</p>
                    </div>
                    <Badge className={cert.revoked_at ? "bg-zinc-600 text-white" : "bg-orange-100 text-orange-700"}>
                      {cert.revoked_at ? "Revogado" : "Válido"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(cert.issued_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(cert)} disabled={!!cert.revoked_at}>
                      Baixar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(cert.certificate_code)}>
                      Copiar link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCert(cert)}>
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCertToRevoke(cert)}
                      disabled={!!cert.revoked_at}
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

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
            <DialogTitle className="flex items-center gap-2">
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

            <Alert className="border-orange-300/60 bg-orange-50/80 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
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
              className="bg-zinc-900 hover:bg-zinc-800 text-white"
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
            <DialogDescription>Informações do certificado selecionado</DialogDescription>
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
                    <Badge className="bg-zinc-600 text-white hover:bg-zinc-600">Revogado</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Válido</Badge>
                  )}
                </div>
              </div>
            </div>

            {selectedCert?.revoked_at && (
              <Alert className="border-orange-300/60 bg-orange-50/80 dark:bg-orange-950/20">
                <AlertDescription className="text-orange-800 dark:text-orange-200">
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

      {/* Hidden certificate render for PDF generation */}
      {downloadingCert && (
        <div
          ref={hiddenPreviewRef}
          className="fixed opacity-0 pointer-events-none"
          style={{ left: "-9999px", top: 0, width: "841.89pt", height: "595.28pt" }}
        >
          <CertificatePreview
            backgroundUrl={eventConfig.backgroundUrl || undefined}
            fields={{ ...DEFAULT_CONFIG.fields, ...eventConfig.fields } as any}
            textConfig={eventConfig.textConfig}
            signers={eventConfig.signers}
            workloadHours={eventConfig.workloadHours}
            sampleData={{
              eventName: event?.title || "Evento",
              participantName: downloadingCert.attendee_name,
              participantCPF: "",
              eventDate: event?.start_date
                ? format(new Date(event.start_date), "dd/MM/yyyy")
                : "",
              eventTime: event?.start_date
                ? format(new Date(event.start_date), "HH:mm")
                : "",
              eventLocation: event?.venue_name || "",
              certificateCode: downloadingCert.certificate_code,
            }}
            textColor={eventConfig.textColor}
            textPositions={eventConfig.textPositions}
            fontSizes={eventConfig.fontSizes}
            mode="production"
          />
        </div>
      )}
    </div>
  );
}

function EstatisticasTab({ eventId, stats }: { eventId: string; stats: CertificateStats | undefined }) {
  const { data: analytics, isLoading } = useCertificateAnalytics(eventId);
  const maxIssuance = useMemo(() => {
    const values = analytics?.issuanceByDay || [];
    if (values.length === 0) return 1;
    return Math.max(...values.map((item) => item.count), 1);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-zinc-800" />
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
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emitidos Hoje</p>
                <p className="text-2xl font-display font-bold">{stats?.issuedToday || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Ban className="h-5 w-5 text-zinc-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revogados</p>
                <p className="text-2xl font-display font-bold">{stats?.revokedCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-display font-bold">{stats?.pendingCertificates || 0}</p>
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
              Emissões por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-6 w-full" />)
              ) : analytics?.issuanceByDay.length ? (
                analytics.issuanceByDay.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-12">{item.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${(item.count / maxIssuance) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem emissões registradas.</p>
              )}
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
          <CardDescription>Ranking baseado em certificados válidos deste evento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-14 w-full" />)
            ) : analytics?.topParticipants.length ? (
              analytics.topParticipants.map((participant, index) => (
                <div
                  key={`${participant.name}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-medium text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Última emissão: {format(new Date(participant.lastIssuedAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{participant.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados suficientes para ranking.</p>
            )}
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
  const { user } = useAuth();

  const { data: event } = useQuery({
    queryKey: ["event-certificates-meta", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, has_certificates, start_date, venue_name, certificate_config, producer_id")
        .eq("id", id!)
        .single();

      if (error && isMissingColumnError(error, "certificate_config")) {
        const { data: legacyData, error: legacyError } = await supabase
          .from("events")
          .select("id, title, start_date, venue_name, producer_id")
          .eq("id", id!)
          .single();
        if (legacyError) throw legacyError;
        return { ...legacyData, has_certificates: true as any };
      }

      if (error) throw error;

      // Se a consulta funcionou, limpa qualquer marcação antiga de coluna ausente.
      missingColumnsCache.delete("certificate_config");

      return data;
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      if (isSchemaMissingError(error)) return false;
      return failureCount < 2;
    },
  });

  const { config, updateConfig, isLoading: isLoadingConfig, schemaError, clearSchemaError } = useCertificateConfig(id);
  const { data: stats, isLoading: isLoadingStats } = useCertificateStats(id);

  // Enable certificates mutation (via Edge Function to bypass RLS issues)
  const enableCertificatesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("toggle-event-certificates", {
        body: { eventId: id, enabled: true },
      });

      if (error) throw error;
      if (!data?.success || data?.event?.has_certificates !== true) {
        throw new Error(
          data?.error || "Nenhuma linha foi atualizada. Possíveis causas: permissão negada, o evento não existe ou o ID está incorreto."
        );
      }
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
      toast({ title: "Certificados ativados", description: "Os certificados de participação foram habilitados para este evento." });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(["event-certificates-meta", id], context.previousEvent);
      }
      const msg = (err as Error).message || "";
      if (isSchemaMissingError(err)) {
        toast({
          title: "Sistema de certificados não configurado",
          description: "O banco de dados ainda não possui as colunas necessárias (has_certificates, certificate_config, etc.). Execute as migrações do Supabase.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erro ao ativar certificados", description: msg, variant: "destructive" });
      }
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
    onError: (err) => {
      toast({
        title: "Erro ao gerar certificados",
        description: (err as Error).message || "Não foi possível gerar os certificados pendentes.",
        variant: "destructive",
      });
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
    onError: (err) => {
      toast({
        title: "Erro ao reemitir",
        description: (err as Error).message || "Não foi possível reemitir todos os certificados.",
        variant: "destructive",
      });
    },
  });

  const producerMismatch = !!event && !!user && event.producer_id !== user.id;

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

        {producerMismatch && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-1">
              <span className="font-medium">Aviso de propriedade do evento</span>
              <span>
                Você não é o produtor registrado deste evento. Se a ativação falhar, entre em contato
                com o administrador.
              </span>
              <span className="text-[10px] opacity-80 font-mono mt-1">
                Seu ID: {user.id} | Producer ID do evento: {event.producer_id || "null"}
              </span>
            </AlertDescription>
          </Alert>
        )}

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
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-zinc-700" />
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
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-zinc-700" />
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
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-orange-600" />
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
            <span className="sm:hidden">Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurar" className="space-y-6">
          {isLoadingConfig ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px]" />
            </div>
          ) : (
            <ConfigurarTab config={config} onConfigChange={updateConfig} eventId={id!} event={event} schemaError={schemaError} clearSchemaError={clearSchemaError} />
          )}
        </TabsContent>

        <TabsContent value="emitidos" className="space-y-6">
          <EmitidosTab eventId={id!} stats={stats} eventConfig={config} event={event} />
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
