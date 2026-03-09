import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, DollarSign, Calendar, Percent } from "lucide-react";
import { calculateResaleFee, createResaleListing } from "@/lib/api-resale";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ResaleListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    event_id: string;
    tier_id: string;
    events?: { title?: string; start_date?: string };
    ticket_tiers?: { name?: string; price?: number };
  };
}

export function ResaleListingModal({ open, onOpenChange, ticket }: ResaleListingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [askingPrice, setAskingPrice] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  const originalPrice = ticket.ticket_tiers?.price || 0;
  const priceNum = parseFloat(askingPrice) || 0;
  const { platformFee, sellerReceives } = calculateResaleFee(priceNum);

  const eventStart = ticket.events?.start_date ? new Date(ticket.events.start_date) : null;
  const maxExpiry = eventStart ? eventStart.toISOString().slice(0, 16) : "";

  const isValid = priceNum > 0 && priceNum <= originalPrice && expiresAt && (!eventStart || new Date(expiresAt) <= eventStart);

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setLoading(true);
    try {
      await createResaleListing({
        ticketId: ticket.id,
        eventId: ticket.event_id,
        tierId: ticket.tier_id,
        sellerId: user.id,
        askingPrice: priceNum,
        originalPrice,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      toast({ title: "Ingresso anunciado!", description: `Seu ingresso está à venda por R$ ${priceNum.toFixed(2)}` });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["resale-listings"] });
      onOpenChange(false);
      setAskingPrice("");
      setExpiresAt("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao anunciar ingresso", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Revender Ingresso</DialogTitle>
          <DialogDescription>
            {ticket.events?.title} — {ticket.ticket_tiers?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Original price info */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Preço original:</span>
            <span className="font-semibold text-foreground">R$ {originalPrice.toFixed(2)}</span>
          </div>

          {/* Asking price */}
          <div className="space-y-2">
            <Label htmlFor="asking-price">Preço de venda</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="asking-price"
                type="number"
                step="0.01"
                min="0.01"
                max={originalPrice}
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
            {priceNum > originalPrice && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                O preço não pode ser superior ao valor original (anti-cambismo)
              </p>
            )}
          </div>

          {/* Fee breakdown */}
          {priceNum > 0 && priceNum <= originalPrice && (
            <div className="space-y-2 p-3 rounded-lg border border-border bg-card">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Taxa da plataforma (10%)
                </span>
                <span className="text-destructive font-medium">- R$ {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span className="text-foreground">Você receberá</span>
                <span className="text-primary">R$ {sellerReceives.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Expiry date */}
          <div className="space-y-2">
            <Label htmlFor="expires-at">Vender até</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                max={maxExpiry}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo: até o início do evento. Após essa data, o anúncio será cancelado automaticamente.
            </p>
          </div>

          {/* Terms notice */}
          <p className="text-xs text-muted-foreground">
            Ao anunciar, você concorda com os{" "}
            <a href="/termos-de-uso#revenda" className="text-primary hover:underline">termos de revenda</a>.
            Após a venda, seu QR Code será invalidado e um novo será gerado para o comprador.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full"
          >
            {loading ? "Anunciando..." : "Anunciar Ingresso"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
