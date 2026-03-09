import { Minus, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TicketTierCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved?: number;
  minPerOrder: number;
  maxPerOrder: number;
  tierType: string;
  onAdd: (tierId: string, quantity: number) => void;
  className?: string;
}

export function TicketTierCard({
  id,
  name,
  description,
  price,
  originalPrice,
  quantityTotal,
  quantitySold,
  minPerOrder,
  maxPerOrder,
  tierType,
  onAdd,
  className,
}: TicketTierCardProps) {
  const [quantity, setQuantity] = useState(minPerOrder);
  const available = quantityTotal - quantitySold;
  const isSoldOut = available <= 0;
  const isLow = available > 0 && available <= 20;

  const increment = () => setQuantity((q) => Math.min(q + 1, Math.min(maxPerOrder, available)));
  const decrement = () => setQuantity((q) => Math.max(q - 1, minPerOrder));

  const formatPrice = (v: number) =>
    v === 0 ? "Grátis" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card",
        isSoldOut && "opacity-50",
        className
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-display font-semibold text-foreground">{name}</h4>
          {isLow && !isSoldOut && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <AlertCircle className="h-3 w-3" /> Últimas unidades
            </span>
          )}
          {isSoldOut && (
            <span className="text-xs font-medium text-destructive">Esgotado</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="flex items-baseline gap-2">
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="font-display font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {tierType === "free" && (
            <span className="text-xs text-muted-foreground">(Gratuito)</span>
          )}
        </div>
      </div>

      {!isSoldOut && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-border rounded-md">
            <button
              onClick={decrement}
              disabled={quantity <= minPerOrder}
              className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
            <button
              onClick={increment}
              disabled={quantity >= Math.min(maxPerOrder, available)}
              className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => onAdd(id, quantity)}>
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
