import { Award, Calendar, MapPin, Clock, User, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface CertificateConfig {
  showEventDate: boolean;
  showEventTime: boolean;
  showEventLocation: boolean;
  showWorkload: boolean;
  workloadHours: number;
  showProducerName: boolean;
  showProducerSignature: boolean;
  customText: string | null;
  template: "default" | "formal" | "modern" | "minimal";
  primaryColor: string | null;
  showLogo: boolean;
}

interface CertificatePreviewProps {
  config: CertificateConfig;
  eventName?: string;
  participantName?: string;
  producerName?: string;
  eventDate?: string;
  eventLocation?: string;
  certificateCode?: string;
  className?: string;
}

const TEMPLATES = {
  default: {
    bg: "bg-gradient-to-br from-orange-50 to-white",
    border: "border-orange-500/30",
    accentColor: "text-orange-600",
    accentBg: "bg-orange-100",
    titleColor: "text-orange-600",
    cornerColor: "bg-orange-500",
  },
  formal: {
    bg: "bg-gradient-to-br from-slate-50 to-white",
    border: "border-slate-700/30",
    accentColor: "text-slate-700",
    accentBg: "bg-slate-200",
    titleColor: "text-slate-800",
    cornerColor: "bg-slate-700",
  },
  modern: {
    bg: "bg-white",
    border: "border-gray-200",
    accentColor: "text-gray-800",
    accentBg: "bg-gray-100",
    titleColor: "text-gray-900",
    cornerColor: "bg-gray-800",
  },
  minimal: {
    bg: "bg-white",
    border: "border-gray-100",
    accentColor: "text-gray-600",
    accentBg: "bg-gray-50",
    titleColor: "text-gray-800",
    cornerColor: "bg-gray-400",
  },
};

export function CertificatePreview({
  config,
  eventName = "Nome do Evento",
  participantName = "Nome do Participante",
  producerName = "Nome do Produtor",
  eventDate = new Date().toLocaleDateString("pt-BR"),
  eventLocation = "Local do Evento",
  certificateCode = "CERT-XXXX-XXXXXXXX-XXX",
  className,
}: CertificatePreviewProps) {
  const template = TEMPLATES[config.template];

  return (
    <div className={cn("relative", className)}>
      {/* Certificate Container */}
      <Card className={cn(
        "relative overflow-hidden",
        "w-full aspect-[1.4/1]", // A4 Landscape ratio
        template.bg,
        template.border,
        "border-2"
      )}>
        {/* Decorative Corners */}
        <div className={cn("absolute top-0 left-0 w-16 h-2", template.cornerColor)} />
        <div className={cn("absolute top-0 left-0 w-2 h-16", template.cornerColor)} />
        <div className={cn("absolute top-0 right-0 w-16 h-2", template.cornerColor)} />
        <div className={cn("absolute top-0 right-0 w-2 h-16", template.cornerColor)} />
        <div className={cn("absolute bottom-0 left-0 w-16 h-2", template.cornerColor)} />
        <div className={cn("absolute bottom-0 left-0 w-2 h-16", template.cornerColor)} />
        <div className={cn("absolute bottom-0 right-0 w-16 h-2", template.cornerColor)} />
        <div className={cn("absolute bottom-0 right-0 w-2 h-16", template.cornerColor)} />

        {/* Inner Border */}
        <div className="absolute inset-4 border border-current opacity-20 rounded-sm" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
          {/* Logo Area */}
          {config.showLogo && (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-gray-800">TICKET</span>
                <span className={cn("text-lg font-bold", template.titleColor)}>HALL</span>
              </div>
            </div>
          )}

          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-3",
            template.accentBg
          )}>
            <Award className={cn("w-6 h-6", template.accentColor)} />
          </div>

          {/* Title */}
          <h2 className={cn("text-xl font-bold mb-1", template.titleColor)}>
            CERTIFICADO DE PARTICIPAÇÃO
          </h2>

          {/* Decorative Line */}
          <div className={cn("w-24 h-0.5 mb-4", template.cornerColor)} />

          {/* Intro Text */}
          {config.customText ? (
            <p className="text-xs text-gray-600 mb-2 max-w-xs">{config.customText}</p>
          ) : (
            <p className="text-xs text-gray-500 mb-2">Certificamos que</p>
          )}

          {/* Participant Name */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {participantName}
          </h3>

          {/* Participation Text */}
          <p className="text-xs text-gray-500 mb-2">participou do evento</p>

          {/* Event Name */}
          <h4 className={cn("text-base font-semibold mb-2", template.accentColor)}>
            {eventName}
          </h4>

          {/* Event Details */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 mb-3">
            {config.showEventDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{eventDate}</span>
              </div>
            )}
            {config.showEventTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Horário</span>
              </div>
            )}
            {config.showEventLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{eventLocation}</span>
              </div>
            )}
          </div>

          {/* Workload */}
          {config.showWorkload && config.workloadHours > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              Carga horária: <span className="font-semibold">{config.workloadHours}h</span>
            </p>
          )}

          {/* Producer Info */}
          {config.showProducerName && (
            <div className="text-xs text-gray-500 mb-2">
              <span>Organizado por </span>
              <span className="font-medium">{producerName}</span>
            </div>
          )}

          {/* Signature Area */}
          {config.showProducerSignature && (
            <div className="mt-2 text-center">
              <div className={cn("w-16 h-0.5 mx-auto mb-1", template.cornerColor)} />
              <p className="text-xs font-medium text-gray-700">Assinatura do Responsável</p>
              <p className="text-[10px] text-gray-500">{producerName}</p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="w-full flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verificação: {certificateCode}</span>
            </div>
            <span>tickethall.com.br</span>
          </div>
        </div>
      </Card>

      {/* Preview Badge */}
      <Badge 
        variant="secondary" 
        className="absolute -top-2 -right-2 bg-blue-100 text-blue-700"
      >
        Preview
      </Badge>
    </div>
  );
}

export function CertificateConfigPanel({
  config,
  onChange,
}: {
  config: CertificateConfig;
  onChange: (config: CertificateConfig) => void;
}) {
  const updateField = <K extends keyof CertificateConfig>(
    field: K,
    value: CertificateConfig[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Template</label>
        <div className="grid grid-cols-4 gap-2">
          {(["default", "formal", "modern", "minimal"] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateField("template", t)}
              className={cn(
                "p-2 rounded-lg border text-xs font-medium capitalize transition-all",
                config.template === t
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Campos do Evento */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Campos do Evento
        </h4>
        
        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Data do evento</span>
          </div>
          <input
            type="checkbox"
            checked={config.showEventDate}
            onChange={(e) => updateField("showEventDate", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Horário</span>
          </div>
          <input
            type="checkbox"
            checked={config.showEventTime}
            onChange={(e) => updateField("showEventTime", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Local/endereço</span>
          </div>
          <input
            type="checkbox"
            checked={config.showEventLocation}
            onChange={(e) => updateField("showEventLocation", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>
      </div>

      {/* Carga Horária */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Carga Horária
        </h4>
        
        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Mostrar carga horária</span>
          </div>
          <input
            type="checkbox"
            checked={config.showWorkload}
            onChange={(e) => updateField("showWorkload", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>

        {config.showWorkload && (
          <div className="pl-6">
            <label className="text-xs text-muted-foreground mb-1 block">
              Quantidade de horas
            </label>
            <input
              type="number"
              min={0}
              max={999}
              value={config.workloadHours}
              onChange={(e) => updateField("workloadHours", parseInt(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-sm border rounded"
            />
          </div>
        )}
      </div>

      {/* Assinatura e Produtor */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Assinatura
        </h4>
        
        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Nome do organizador</span>
          </div>
          <input
            type="checkbox"
            checked={config.showProducerName}
            onChange={(e) => updateField("showProducerName", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Assinatura digital</span>
          </div>
          <input
            type="checkbox"
            checked={config.showProducerSignature}
            onChange={(e) => updateField("showProducerSignature", e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>
      </div>

      {/* Texto Personalizado */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Texto personalizado (opcional)</label>
        <textarea
          value={config.customText || ""}
          onChange={(e) => updateField("customText", e.target.value || null)}
          placeholder="Ex: Certificamos que o participante compareceu..."
          className="w-full px-3 py-2 text-sm border rounded-lg min-h-[80px]"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar o texto padrão
        </p>
      </div>
    </div>
  );
}
