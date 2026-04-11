/**
 * ColorConfigurator Component
 * 
 * Two color pickers with hex input, color contrast ratio display,
 * preset color palettes based on template, and live preview.
 */

import { useState, useMemo } from "react";
import { Palette, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type CertificateTemplateId } from "@/lib/certificates/templates";

export interface ColorConfiguratorProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
  templateId: CertificateTemplateId;
}

// Preset color palettes based on template
const TEMPLATE_PALETTES: Record<
  CertificateTemplateId,
  { primary: string; secondary: string; name: string }[]
> = {
  executive: [
    { primary: "#1a365d", secondary: "#c9a227", name: "Clássico" },
    { primary: "#1e3a5f", secondary: "#d4af37", name: "Ouro" },
    { primary: "#2d3748", secondary: "#b7791f", name: "Bronze" },
    { primary: "#1a202c", secondary: "#ecc94b", name: "Preto & Dourado" },
  ],
  modern: [
    { primary: "#ea580b", secondary: "#1f2937", name: "TicketHall" },
    { primary: "#2563eb", secondary: "#1e40af", name: "Azul" },
    { primary: "#059669", secondary: "#047857", name: "Verde" },
    { primary: "#7c3aed", secondary: "#5b21b6", name: "Roxo" },
  ],
  academic: [
    { primary: "#064e3b", secondary: "#d4af37", name: "Verde & Ouro" },
    { primary: "#1e3a8a", secondary: "#c9a227", name: "Azul & Ouro" },
    { primary: "#7f1d1d", secondary: "#fbbf24", name: "Vinho" },
    { primary: "#312e81", secondary: "#818cf8", name: "Índigo" },
  ],
  creative: [
    { primary: "#7c3aed", secondary: "#ec4899", name: "Neon" },
    { primary: "#0891b2", secondary: "#22d3ee", name: "Ciano" },
    { primary: "#db2777", secondary: "#f472b6", name: "Rosa" },
    { primary: "#ea580b", secondary: "#fbbf24", name: "Laranja" },
  ],
};

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get accessibility rating based on contrast ratio
 */
function getAccessibilityRating(
  ratio: number
): {
  level: string;
  color: string;
  description: string;
} {
  if (ratio >= 7) {
    return {
      level: "AAA",
      color: "text-green-500",
      description: "Excelente contraste",
    };
  }
  if (ratio >= 4.5) {
    return {
      level: "AA",
      color: "text-green-500",
      description: "Bom contraste",
    };
  }
  if (ratio >= 3) {
    return {
      level: "AA Large",
      color: "text-yellow-500",
      description: "Contraste aceitável para texto grande",
    };
  }
  return {
    level: "Fail",
    color: "text-red-500",
    description: "Contraste insuficiente",
  };
}

interface ColorInputProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  id: string;
}

function ColorInput({ label, color, onChange, id }: ColorInputProps) {
  const [inputValue, setInputValue] = useState(color);
  const [isValid, setIsValid] = useState(true);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
    setIsValid(isValidHex);
    if (isValidHex) {
      onChange(value.toLowerCase());
    }
  };

  const handleBlur = () => {
    if (!isValid) {
      setInputValue(color);
      setIsValid(true);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            id={`${id}-picker`}
            value={color}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsValid(true);
              onChange(e.target.value);
            }}
            className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer overflow-hidden"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute inset-0 rounded-md pointer-events-none border-2 border-border"
            style={{ backgroundColor: color }}
          />
        </div>
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            "flex-1 font-mono text-sm uppercase",
            !isValid && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export function ColorConfigurator({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
  templateId,
}: ColorConfiguratorProps) {
  const contrastRatio = useMemo(
    () => getContrastRatio(primaryColor, secondaryColor),
    [primaryColor, secondaryColor]
  );

  const accessibility = getAccessibilityRating(contrastRatio);
  const palettes = TEMPLATE_PALETTES[templateId] || TEMPLATE_PALETTES.modern;

  const handleReset = () => {
    const defaultPalette = palettes[0];
    onPrimaryChange(defaultPalette.primary);
    onSecondaryChange(defaultPalette.secondary);
  };

  return (
    <div className="space-y-6">
      {/* Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ColorInput
          id="primary-color"
          label="Cor Primária"
          color={primaryColor}
          onChange={onPrimaryChange}
        />
        <ColorInput
          id="secondary-color"
          label="Cor Secundária"
          color={secondaryColor}
          onChange={onSecondaryChange}
        />
      </div>

      {/* Contrast Ratio */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md border border-border flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: primaryColor,
                color: secondaryColor,
              }}
            >
              Aa
            </div>
            <div>
              <p className="text-sm font-medium">Contraste</p>
              <p className="text-xs text-muted-foreground">
                {contrastRatio.toFixed(2)}:1
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold",
                    accessibility.color.replace("text-", "bg-").replace("-500", "/10") +
                      " " +
                      accessibility.color
                  )}
                >
                  {accessibility.level}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{accessibility.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>

      {/* Preset Palettes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Paleta de Cores</Label>
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

        <div className="grid grid-cols-2 gap-2">
          {palettes.map((palette, index) => (
            <button
              key={index}
              onClick={() => {
                onPrimaryChange(palette.primary);
                onSecondaryChange(palette.secondary);
              }}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border transition-all",
                "hover:border-primary/50 hover:bg-muted/30",
                primaryColor === palette.primary &&
                  secondaryColor === palette.secondary
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex -space-x-1">
                <div
                  className="w-5 h-5 rounded-full border-2 border-background"
                  style={{ backgroundColor: palette.primary }}
                />
                <div
                  className="w-5 h-5 rounded-full border-2 border-background"
                  style={{ backgroundColor: palette.secondary }}
                />
              </div>
              <span className="text-xs font-medium truncate">{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Pré-visualização</Label>
        <div
          className="h-20 rounded-lg border border-border flex items-center justify-center gap-4"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          <div
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: primaryColor,
              color: "#ffffff",
            }}
          >
            Botão Primário
          </div>
          <div
            className="px-4 py-2 rounded-md text-sm font-medium border"
            style={{
              borderColor: secondaryColor,
              color: secondaryColor,
            }}
          >
            Botão Secundário
          </div>
        </div>
      </div>
    </div>
  );
}
