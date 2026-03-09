import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingSeatMap } from "./BookingSeatMap";

interface Props {
  tiers: any[];
  selectedDate: Date;
  onSelectTier: (tier: any, quantity: number) => void;
  seatMapConfig?: { imageUrl?: string; tierColors?: Record<string, string> } | null;
  hasSeatMap?: boolean;
}

const fmt = (v: number) => v === 0 ? "Grátis" : `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

export function BookingTicketStep({ tiers, selectedDate, onSelectTier, seatMapConfig, hasSeatMap }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (id: string) => quantities[id] ?? 1;
  const setQty = (id: string, val: number, min: number, max: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(min, Math.min(max, val)) }));
  };

  const availableTiers = tiers.filter((t) => {
    if (!t.is_visible) return false;
    const available = t.quantity_total - (t.quantity_sold ?? 0) - (t.quantity_reserved ?? 0);
    return available > 0;
  });

  const handleContinue = () => {
    if (!selectedId) return;
    const tier = tiers.find((t) => t.id === selectedId);
    if (tier) onSelectTier(tier, getQty(selectedId));
  };

  const tierColors = seatMapConfig?.tierColors || {};

  return (
    <div className="space-y-4">
      {/* Show seat map image if available */}
      {hasSeatMap && seatMapConfig?.imageUrl && (
        <div className="mb-4">
          <BookingSeatMap seatMapConfig={seatMapConfig} tiers={tiers} />
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">Escolha seu ingresso</p>

      {availableTiers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum ingresso disponível para esta data.</p>
      ) : (
        <div className="space-y-3">
          {availableTiers.map((tier) => {
            const available = tier.quantity_total - (tier.quantity_sold ?? 0) - (tier.quantity_reserved ?? 0);
            const min = tier.min_per_order ?? 1;
            const max = Math.min(tier.max_per_order ?? 10, available);
            const isSelected = selectedId === tier.id;
            const qty = getQty(tier.id);
            const sectorColor = tierColors[tier.name];

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedId(tier.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Color dot when seat map is active */}
                      {sectorColor && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sectorColor }}
                          title={`Setor: ${tier.name}`}
                        />
                      )}
                      <p className="font-semibold text-foreground">{tier.name}</p>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tier.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {available} disponíve{available !== 1 ? "is" : "l"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {tier.original_price && tier.original_price > (tier.price ?? 0) && (
                      <p className="text-xs text-muted-foreground line-through">{fmt(tier.original_price)}</p>
                    )}
                    <p className="font-bold text-foreground">{fmt(tier.price ?? 0)}</p>
                  </div>
                </div>

                {/* Quantity selector - only shown when selected */}
                {isSelected && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); setQty(tier.id, qty - 1, min, max); }}
                      disabled={qty <= min}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-lg font-bold w-8 text-center">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); setQty(tier.id, qty + 1, min, max); }}
                      disabled={qty >= max}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedId && (
        <Button className="w-full" size="lg" onClick={handleContinue}>
          Continuar · {fmt((tiers.find((t) => t.id === selectedId)?.price ?? 0) * getQty(selectedId))}
        </Button>
      )}
    </div>
  );
}
