import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CertificateTextPositions, CertificateFontSizes } from "./CertificatePreview";

interface TextPositionControlsProps {
  textColor: string;
  textPositions: CertificateTextPositions;
  fontSizes: CertificateFontSizes;
  onChange: (updates: { textColor?: string; textPositions?: CertificateTextPositions; fontSizes?: CertificateFontSizes }) => void;
}

export function TextPositionControls({ textColor, textPositions, fontSizes, onChange }: TextPositionControlsProps) {
  const updatePosition = (key: keyof CertificateTextPositions, value: number) => {
    onChange({
      textPositions: { ...textPositions, [key]: value },
    });
  };

  const updateFontSize = (key: keyof CertificateFontSizes, value: CertificateFontSizes[keyof CertificateFontSizes]) => {
    onChange({
      fontSizes: { ...fontSizes, [key]: value },
    });
  };

  const presets = [
    { label: "Preto", value: "#1f2937" },
    { label: "Cinza escuro", value: "#374151" },
    { label: "Laranja", value: "#ff6b00" },
    { label: "Branco", value: "#ffffff" },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Cor do texto</Label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange({ textColor: preset.value })}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                textColor === preset.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
              }`}
              style={{ color: preset.value === "#ffffff" ? "#1f2937" : preset.value }}
            >
              {preset.label}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-xs text-muted-foreground">Personalizada</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Posicionamento dos textos</Label>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Posição do título</span>
            <span className="text-muted-foreground">{textPositions.titleTop}%</span>
          </div>
          <input
            type="range"
            min={2}
            max={25}
            value={textPositions.titleTop}
            onChange={(e) => updatePosition("titleTop", parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Posição do nome</span>
            <span className="text-muted-foreground">{textPositions.nameTop}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={45}
            value={textPositions.nameTop}
            onChange={(e) => updatePosition("nameTop", parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Posição dos dados (evento, data, local)</span>
            <span className="text-muted-foreground">{textPositions.metadataTop}%</span>
          </div>
          <input
            type="range"
            min={25}
            max={65}
            value={textPositions.metadataTop}
            onChange={(e) => updatePosition("metadataTop", parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Tamanhos das fontes</Label>
        
        <div className="space-y-2">
          <span className="text-xs">Título</span>
          <select
            value={fontSizes.title}
            onChange={(e) => updateFontSize("title", e.target.value as CertificateFontSizes["title"])}
            className="w-full h-9 px-2 text-sm border rounded-lg bg-background"
          >
            <option value="xs">Muito pequeno</option>
            <option value="sm">Pequeno</option>
            <option value="base">Normal</option>
            <option value="lg">Médio</option>
            <option value="xl">Grande</option>
            <option value="2xl">Muito grande</option>
            <option value="3xl">Extra grande</option>
            <option value="4xl">Título enorme</option>
          </select>
        </div>

        <div className="space-y-2">
          <span className="text-xs">Nome do participante</span>
          <select
            value={fontSizes.name}
            onChange={(e) => updateFontSize("name", e.target.value as CertificateFontSizes["name"])}
            className="w-full h-9 px-2 text-sm border rounded-lg bg-background"
          >
            <option value="sm">Pequeno</option>
            <option value="base">Normal</option>
            <option value="lg">Médio</option>
            <option value="xl">Grande</option>
            <option value="2xl">Muito grande</option>
            <option value="3xl">Extra grande</option>
            <option value="4xl">Enorme</option>
            <option value="5xl">Título de capa</option>
          </select>
        </div>

        <div className="space-y-2">
          <span className="text-xs">Nome do evento</span>
          <select
            value={fontSizes.event}
            onChange={(e) => updateFontSize("event", e.target.value as CertificateFontSizes["event"])}
            className="w-full h-9 px-2 text-sm border rounded-lg bg-background"
          >
            <option value="xs">Muito pequeno</option>
            <option value="sm">Pequeno</option>
            <option value="base">Normal</option>
            <option value="lg">Médio</option>
            <option value="xl">Grande</option>
            <option value="2xl">Muito grande</option>
            <option value="3xl">Extra grande</option>
          </select>
        </div>
      </div>
    </div>
  );
}
