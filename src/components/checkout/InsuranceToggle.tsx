import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface InsuranceToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  price: number;
}

export function InsuranceToggle({ enabled, onEnabledChange, price }: InsuranceToggleProps) {
  if (price <= 0) return null;

  return (
    <Card className={enabled ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">Seguro de Ingresso</p>
          <p className="text-xs text-muted-foreground">
            Proteja sua compra contra imprevistos. Reembolso integral em caso de impossibilidade de comparecimento.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-foreground">
            {formatBRL(price)}
          </p>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardContent>
    </Card>
  );
}
