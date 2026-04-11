/**
 * FieldConfigurator Component
 * 
 * Checkboxes for each certificate field with CPF masking sub-option,
 * workload number input, grouped logically with section headers and info tooltips.
 */

import { User, Calendar, MapPin, Clock, FileText, Users, QrCode, ShieldCheck, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FieldConfiguratorProps {
  fields: {
    showEventName: boolean;
    showParticipantName: boolean;
    showParticipantLastName: boolean;
    showCPF: boolean;
    maskCPF: boolean;
    showEventDate: boolean;
    showEventTime: boolean;
    showEventLocation: boolean;
    showWorkload: boolean;
    showSigners: boolean;
    showQRCode: boolean;
  };
  workloadHours?: number;
  onChange: (fields: FieldConfiguratorProps["fields"]) => void;
  onWorkloadChange?: (hours: number) => void;
}

interface FieldOptionProps {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function FieldOption({
  id,
  label,
  description,
  icon,
  checked,
  onCheckedChange,
  disabled = false,
  children,
}: FieldOptionProps) {
  return (
    <div className={cn("space-y-3", disabled && "opacity-50")}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={id}
              className={cn(
                "text-sm font-medium cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              {label}
            </Label>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {icon}
          </div>
        </div>
      </div>
      {checked && children && (
        <div className="pl-6 border-l-2 border-muted ml-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
}

function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <h4 className="text-xs font-semibold uppercase tracking-wide">
        {title}
      </h4>
    </div>
  );
}

export function FieldConfigurator({
  fields,
  workloadHours = 0,
  onChange,
  onWorkloadChange,
}: FieldConfiguratorProps) {
  const updateField = <K extends keyof typeof fields>(
    field: K,
    value: (typeof fields)[K]
  ) => {
    onChange({ ...fields, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Participant Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Informações do Participante"
          icon={<User className="w-4 h-4" />}
        />
        <Card className="p-4 space-y-4">
          <FieldOption
            id="show-participant-name"
            label="Nome do participante"
            description="Exibe o primeiro nome do participante no certificado"
            icon={<span className="text-xs text-muted-foreground">Ex: João</span>}
            checked={fields.showParticipantName}
            onCheckedChange={(checked) =>
              updateField("showParticipantName", checked)
            }
          />

          <FieldOption
            id="show-participant-lastname"
            label="Sobrenome do participante"
            description="Exibe o sobrenome completo do participante"
            icon={<span className="text-xs text-muted-foreground">Ex: Silva Santos</span>}
            checked={fields.showParticipantLastName}
            onCheckedChange={(checked) =>
              updateField("showParticipantLastName", checked)
            }
            disabled={!fields.showParticipantName}
          />

          <FieldOption
            id="show-cpf"
            label="CPF do participante"
            description="Exibe o CPF para validação oficial do certificado"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showCPF}
            onCheckedChange={(checked) => updateField("showCPF", checked)}
          >
            <div className="py-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="mask-cpf"
                  className="text-sm cursor-pointer"
                >
                  Mascarar CPF
                </Label>
                <Switch
                  id="mask-cpf"
                  checked={fields.maskCPF}
                  onCheckedChange={(checked) =>
                    updateField("maskCPF", checked)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {fields.maskCPF
                  ? "Exibe como ***.XXX.XXX-XX"
                  : "Exibe o número completo"}
              </p>
            </div>
          </FieldOption>
        </Card>
      </div>

      <Separator />

      {/* Event Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Informações do Evento"
          icon={<Calendar className="w-4 h-4" />}
        />
        <Card className="p-4 space-y-4">
          <FieldOption
            id="show-event-name"
            label="Nome do evento"
            description="Exibe o nome completo do evento no certificado"
            icon={<span className="text-xs text-muted-foreground">Título principal</span>}
            checked={fields.showEventName}
            onCheckedChange={(checked) =>
              updateField("showEventName", checked)
            }
          />

          <FieldOption
            id="show-event-date"
            label="Data do evento"
            description="Exibe a data de realização do evento"
            icon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showEventDate}
            onCheckedChange={(checked) =>
              updateField("showEventDate", checked)
            }
          />

          <FieldOption
            id="show-event-time"
            label="Horário do evento"
            description="Exibe o horário de início e término"
            icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showEventTime}
            onCheckedChange={(checked) =>
              updateField("showEventTime", checked)
            }
          />

          <FieldOption
            id="show-event-location"
            label="Local do evento"
            description="Exibe o endereço ou local de realização"
            icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showEventLocation}
            onCheckedChange={(checked) =>
              updateField("showEventLocation", checked)
            }
          />

          <FieldOption
            id="show-workload"
            label="Carga horária"
            description="Exibe a carga horária total do evento"
            icon={<FileText className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showWorkload}
            onCheckedChange={(checked) =>
              updateField("showWorkload", checked)
            }
          >
            <div className="py-2">
              <Label
                htmlFor="workload-hours"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Quantidade de horas
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="workload-hours"
                  type="number"
                  min={0}
                  max={999}
                  value={workloadHours}
                  onChange={(e) =>
                    onWorkloadChange?.(
                      Math.min(999, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-24 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            </div>
          </FieldOption>
        </Card>
      </div>

      <Separator />

      {/* Validation Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Validação e Assinaturas"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <Card className="p-4 space-y-4">
          <FieldOption
            id="show-signers"
            label="Assinaturas"
            description="Exibe as assinaturas dos responsáveis pelo evento"
            icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showSigners}
            onCheckedChange={(checked) =>
              updateField("showSigners", checked)
            }
          />

          <FieldOption
            id="show-qrcode"
            label="QR Code de verificação"
            description="Adiciona um QR Code para validação digital do certificado"
            icon={<QrCode className="w-3.5 h-3.5 text-muted-foreground" />}
            checked={fields.showQRCode}
            onCheckedChange={(checked) =>
              updateField("showQRCode", checked)
            }
          />
        </Card>
      </div>
    </div>
  );
}
