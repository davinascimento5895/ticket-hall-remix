import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function RefundDialog({ open, onOpenChange, order }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  const { data: tickets = [] } = useQuery({
    queryKey: ["order-tickets-refund", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, ticket_tiers(name, price)")
        .eq("order_id", order.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!order?.id && open,
  });

  const { data: existingRefunds = [] } = useQuery({
    queryKey: ["order-refunds", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refunds")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!order?.id && open,
  });

  const totalRefunded = existingRefunds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const maxRefundable = (order?.total || 0) - totalRefunded;

  const refundMutation = useMutation({
    mutationFn: async () => {
      const refundAmount = refundType === "full" ? maxRefundable : parseFloat(amount);

      if (refundAmount <= 0 || refundAmount > maxRefundable) {
        throw new Error("Valor de reembolso inválido");
      }

      // Calculate platform fee portion to refund
      const feeRatio = order.platform_fee / order.total;
      const platformFeeRefunded = refundAmount * feeRatio;

      // Insert refund record
      const { error: refundError } = await supabase.from("refunds").insert({
        order_id: order.id,
        amount: refundAmount,
        platform_fee_refunded: platformFeeRefunded,
        reason: reason || null,
        initiated_by: user?.id,
        status: "pending",
        ticket_ids: selectedTicketIds.length > 0 ? selectedTicketIds : null,
      });
      if (refundError) throw refundError;

      // Update order
      const newRefundedAmount = totalRefunded + refundAmount;
      const isFullRefund = newRefundedAmount >= order.total;

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          refunded_amount: newRefundedAmount,
          refund_reason: reason || null,
          refunded_at: new Date().toISOString(),
          status: isFullRefund ? "refunded" : order.status,
        })
        .eq("id", order.id);
      if (orderError) throw orderError;

      // Update selected tickets to refunded status
      if (selectedTicketIds.length > 0) {
        await supabase
          .from("tickets")
          .update({ status: "refunded" })
          .in("id", selectedTicketIds);
      } else if (isFullRefund) {
        await supabase
          .from("tickets")
          .update({ status: "refunded" })
          .eq("order_id", order.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-refunds"] });
      toast({ title: "Reembolso registrado com sucesso" });
      onOpenChange(false);
      setAmount("");
      setReason("");
      setSelectedTicketIds([]);
      setRefundType("full");
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  const toggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reembolsar pedido</DialogTitle>
          <DialogDescription>Pedido #{order.id.slice(0, 8)} · Total: {fmt(order.total)}</DialogDescription>
        </DialogHeader>

        {/* Existing refunds */}
        {existingRefunds.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reembolsos anteriores</Label>
            {existingRefunds.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary">
                <div>
                  <span className="font-medium">{fmt(r.amount)}</span>
                  {r.reason && <span className="text-muted-foreground ml-2">— {r.reason}</span>}
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Total reembolsado: {fmt(totalRefunded)} · Restante: {fmt(maxRefundable)}
            </p>
          </div>
        )}

        {maxRefundable <= 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Este pedido já foi totalmente reembolsado.</p>
        ) : (
          <div className="space-y-4">
            {/* Refund type */}
            <div className="flex gap-2">
              <Button
                variant={refundType === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setRefundType("full")}
              >
                Reembolso total ({fmt(maxRefundable)})
              </Button>
              <Button
                variant={refundType === "partial" ? "default" : "outline"}
                size="sm"
                onClick={() => setRefundType("partial")}
              >
                Parcial
              </Button>
            </div>

            {refundType === "partial" && (
              <>
                <div>
                  <Label>Valor do reembolso (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxRefundable}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>

                {/* Select tickets */}
                {tickets.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Selecionar ingressos (opcional)</Label>
                    <div className="space-y-2 mt-2">
                      {tickets
                        .filter((t: any) => t.status !== "refunded")
                        .map((ticket: any) => (
                          <label key={ticket.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={selectedTicketIds.includes(ticket.id)}
                              onCheckedChange={() => toggleTicket(ticket.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{ticket.attendee_name || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground">
                                {ticket.ticket_tiers?.name} · {fmt(ticket.ticket_tiers?.price || 0)}
                              </p>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo do reembolso..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {maxRefundable > 0 && (
            <Button
              variant="destructive"
              onClick={() => refundMutation.mutate()}
              disabled={refundMutation.isPending || (refundType === "partial" && !amount)}
            >
              {refundMutation.isPending ? "Processando..." : "Confirmar reembolso"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
