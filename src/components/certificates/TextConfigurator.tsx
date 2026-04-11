/**
 * TextConfigurator Component
 * 
 * Text inputs for certificate content with character counters,
 * preset text templates, and live preview.
 */

import { useState, useCallback } from "react";
import { Type, AlignLeft, Sparkles, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type CertificateTemplateId } from "@/lib/certificates/templates";

export interface TextConfiguratorProps {
  config: {
    title: string;
    introText: string;
    participationText: string;
    conclusionText: string;
  };
  onChange: (config: TextConfiguratorProps["config"]) => void;
  templateId: CertificateTemplateId;
}

// Character limits for each field
const CHAR_LIMITS = {
  title: 60,
  introText: 100,
  participationText: 80,
  conclusionText: 120,
} as const;

// Preset text templates
const TEXT_PRESETS = {
  padrao: {
    name: "Padrão",
    description: "Texto clássico e formal",
    config: {
      title: "CERTIFICADO DE PARTICIPAÇÃO",
      introText: "Certificamos que",
      participationText: "participou do evento",
      conclusionText:
        "Este certificado é concedido em reconhecimento à participação e dedicação demonstrada durante o evento.",
    },
  },
  formal: {
    name: "Formal",
    description: "Para fins oficiais e acadêmicos",
    config: {
      title: "CERTIFICADO",
      introText: "Certificamos, para os devidos fins, que",
      participationText: "compareceu e participou ativamente do evento",
      conclusionText:
        "O presente certificado é emitido em conformidade com as normas estabelecidas e poderá ser utilizado para fins de comprovação de atividades.",
    },
  },
  simples: {
    name: "Simples",
    description: "Direto e objetivo",
    config: {
      title: "Certificado",
      introText: "Participou do evento",
      participationText: "",
      conclusionText: "",
    },
  },
  academico: {
    name: "Acadêmico",
    description: "Ideal para instituições de ensino",
    config: {
      title: "CERTIFICADO DE PARTICIPAÇÃO",
      introText: "Certificamos a participação de",
      participationText: "no evento acadêmico",
      conclusionText:
        "Este documento comprova a participação do estudante nas atividades programadas, contribuindo para sua formação acadêmica e profissional.",
    },
  },
  corporativo: {
    name: "Corporativo",
    description: "Para eventos empresariais",
    config: {
      title: "CERTIFICADO DE CONCLUSÃO",
      introText: "Certificamos que o profissional",
      participationText: "concluiu com êxito a participação no evento",
      conclusionText:
        "Reconhecemos o comprometimento e a excelência demonstrados durante as atividades realizadas.",
    },
  },
} as const;

type PresetKey = keyof typeof TEXT_PRESETS;

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
}

function TextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  placeholder,
}: TextFieldProps) {
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isAtLimit = charCount >= maxLength;

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span
          className={cn(
            "text-xs transition-colors",
            isAtLimit
              ? "text-destructive font-medium"
              : isNearLimit
              ? "text-warning"
              : "text-muted-foreground"
          )}
        >
          {charCount}/{maxLength}
        </span>
      </div>
      <InputComponent
        id={id}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value.slice(0, maxLength);
          onChange(newValue);
        }}
        placeholder={placeholder}
        className={cn(
          isAtLimit && "border-destructive focus-visible:ring-destructive"
        )}
        rows={multiline ? 3 : undefined}
      />
    </div>
  );
}

export function TextConfigurator({
  config,
  onChange,
  templateId,
}: TextConfiguratorProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | "custom">(
    "custom"
  );

  const updateField = useCallback(
    <K extends keyof typeof config>(field: K, value: (typeof config)[K]) => {
      onChange({ ...config, [field]: value });
      setSelectedPreset("custom");
    },
    [config, onChange]
  );

  const handlePresetChange = (presetKey: PresetKey) => {
    setSelectedPreset(presetKey);
    onChange(TEXT_PRESETS[presetKey].config);
  };

  const handleReset = () => {
    handlePresetChange("padrao");
  };

  // Template-specific styling hints
  const getTemplateHint = (): string => {
    switch (templateId) {
      case "executive":
        return "Use textos formais e elegantes para complementar o design executivo.";
      case "modern":
        return "Textos curtos e diretos funcionam melhor com o design moderno.";
      case "academic":
        return "Textos acadêmicos formais são ideais para este template.";
      case "creative":
        return "Seja criativo! Textos personalizados destacam-se neste design.";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Modelo de Texto</Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs"
          >
            <RefreshCcw className="w-3 h-3 mr-1" />
            Resetar
          </Button>
        </div>

        <Select
          value={selectedPreset}
          onValueChange={(value) => handlePresetChange(value as PresetKey)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TEXT_PRESETS) as PresetKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {TEXT_PRESETS[key].name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {TEXT_PRESETS[key].description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {getTemplateHint() && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 {getTemplateHint()}
          </p>
        )}
      </div>

      {/* Text Fields */}
      <Card className="p-4 space-y-4">
        <TextField
          id="title"
          label="Título do Certificado"
          value={config.title}
          onChange={(value) => updateField("title", value)}
          maxLength={CHAR_LIMITS.title}
          placeholder="Ex: CERTIFICADO DE PARTICIPAÇÃO"
        />

        <TextField
          id="intro-text"
          label="Texto de Introdução"
          value={config.introText}
          onChange={(value) => updateField("introText", value)}
          maxLength={CHAR_LIMITS.introText}
          placeholder="Ex: Certificamos que"
        />

        <TextField
          id="participation-text"
          label="Texto de Participação"
          value={config.participationText}
          onChange={(value) => updateField("participationText", value)}
          maxLength={CHAR_LIMITS.participationText}
          placeholder="Ex: participou do evento"
        />

        <TextField
          id="conclusion-text"
          label="Texto de Conclusão"
          value={config.conclusionText}
          onChange={(value) => updateField("conclusionText", value)}
          maxLength={CHAR_LIMITS.conclusionText}
          multiline
          placeholder="Ex: Este certificado é concedido em reconhecimento..."
        />
      </Card>

      {/* Live Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Pré-visualização</Label>
        </div>
        <Card className="p-4 bg-muted/30">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              {config.title || "Título do Certificado"}
            </h3>
            <div className="w-16 h-0.5 bg-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {config.introText || "Texto de introdução..."}
            </p>
            <p className="text-base font-semibold text-foreground">
              [Nome do Participante]
            </p>
            {config.participationText && (
              <p className="text-sm text-muted-foreground">
                {config.participationText}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              [Nome do Evento]
            </p>
            {config.conclusionText && (
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {config.conclusionText}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
