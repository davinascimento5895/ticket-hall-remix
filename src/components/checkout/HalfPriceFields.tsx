import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";

interface HalfPriceFieldsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  docType: string;
  onDocTypeChange: (type: string) => void;
  docNumber: string;
  onDocNumberChange: (num: string) => void;
}

export function HalfPriceFields({
  enabled,
  onEnabledChange,
  docType,
  onDocTypeChange,
  docNumber,
  onDocNumberChange,
}: HalfPriceFieldsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Meia-entrada</CardTitle>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-3 pt-0">
          <p className="text-xs text-muted-foreground">
            Conforme Lei 12.933/2013, estudantes, idosos (60+), PcD e jovens de baixa renda têm direito à meia-entrada.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Tipo de documento</Label>
            <Select value={docType} onValueChange={onDocTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student_id">Carteira de Estudante (CIE)</SelectItem>
                <SelectItem value="senior_id">Documento de Identidade (60+)</SelectItem>
                <SelectItem value="disability_id">Carteira PcD</SelectItem>
                <SelectItem value="id_jovem">ID Jovem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Número do documento</Label>
            <Input
              placeholder="Número do documento comprobatório"
              value={docNumber}
              onChange={(e) => onDocNumberChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O documento será verificado na entrada do evento.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
