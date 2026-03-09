import { Minus, Plus, AlertCircle, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { joinWaitlist } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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
  salesStartDate?: string | null;
  salesEndDate?: string | null;
  eventId?: string;
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
  quantityReserved = 0,
  minPerOrder,
  maxPerOrder,
  tierType,
  salesStartDate,
  salesEndDate,
  eventId,
  onAdd,
  className,
}: TicketTierCardProps) {
  const [quantity, setQuantity] = useState(minPerOrder);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const { user } = useAuth();
  const available = quantityTotal - quantitySold - quantityReserved;
  const isSoldOut = available <= 0;
  const isLow = available > 0 && available <= 20;

  // Pre-sale logic
  const now = new Date();
  const salesStart = salesStartDate ? new Date(salesStartDate) : null;
  const salesEnd = salesEndDate ? new Date(salesEndDate) : null;
  const isNotYetOnSale = salesStart && salesStart > now;
  const isSalesEnded = salesEnd && salesEnd < now;

  const increment = () => setQuantity((q) => Math.min(q + 1, Math.min(maxPerOrder, available)));
  const decrement = () => setQuantity((q) => Math.max(q - 1, minPerOrder));

  const formatPrice = (v: number) =>
    v === 0 ? "Grátis" : `R$ ${v.toFixed(2).replace(".", ",")}`;

  const formatCountdown = (date: Date) => {
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const handleJoinWaitlist = async () => {
    if (!user || !eventId) {
      toast({ title: "Faça login para entrar na lista de espera", variant: "destructive" });
      return;
    }
    setJoiningWaitlist(true);
    try {
      await joinWaitlist({
        event_id: eventId,
        tier_id: id,
        user_id: user.id,
        email: user.email || "",
      });
      toast({ title: "Inscrito na lista de espera!", description: "Você será notificado quando houver disponibilidade." });
    } catch (err: any) {
      if (err?.message?.includes("duplicate") || err?.code === "23505") {
        toast({ title: "Você já está na lista de espera" });
      } else {
        toast({ title: "Erro ao entrar na lista", description: err?.message, variant: "destructive" });
      }
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const isDisabled = isSoldOut || isNotYetOnSale || isSalesEnded;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card",
        isDisabled && "opacity-60",
        className
      )}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-display font-semibold text-foreground">{name}</h4>
          {isLow && !isSoldOut && !isNotYetOnSale && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <AlertCircle className="h-3 w-3" /> Últimas unidades
            </span>
          )}
          {isSoldOut && (
            <span className="text-xs font-medium text-destructive">Esgotado</span>
          )}
          {isNotYetOnSale && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> Vendas em {formatCountdown(salesStart!)}
            </span>
          )}
          {isSalesEnded && !isSoldOut && (
            <span className="text-xs font-medium text-muted-foreground">Vendas encerradas</span>
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
        {isNotYetOnSale && salesStart && (
          <p className="text-xs text-muted-foreground">
            Vendas iniciam em {salesStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {!isDisabled && (
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

      {isSoldOut && eventId && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleJoinWaitlist}
          disabled={joiningWaitlist}
        >
          <Bell className="h-4 w-4" />
          {joiningWaitlist ? "Entrando..." : "Me avise"}
        </Button>
      )}
    </div>
  );
}
