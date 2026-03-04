import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TransferTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  eventTitle: string;
  tierName: string;
}

export function TransferTicketModal({
  open,
  onOpenChange,
  ticketId,
  eventTitle,
  tierName,
}: TransferTicketModalProps) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!email || email !== confirmEmail) {
        throw new Error("Os emails não coincidem");
      }

      const { data, error } = await supabase.functions.invoke("transfer-ticket", {
        body: { ticketId, recipientEmail: email.toLowerCase().trim() },
      });

      if (error) {
        const parsed = typeof error === "object" && "message" in error ? error.message : String(error);
        throw new Error(parsed);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast({ title: "Ingresso transferido!", description: `Enviado para ${email}` });
      setEmail("");
      setConfirmEmail("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro na transferência", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Ingresso</DialogTitle>
          <DialogDescription>
            Transfira seu ingresso <strong>{tierName}</strong> para <strong>{eventTitle}</strong> para outra pessoa.
            Esta ação é irreversível — o QR code atual será invalidado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email do destinatário</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmEmail">Confirme o email</Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
          {email && confirmEmail && email !== confirmEmail && (
            <p className="text-sm text-destructive">Os emails não coincidem.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => transferMutation.mutate()}
            disabled={!email || email !== confirmEmail || transferMutation.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {transferMutation.isPending ? "Transferindo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
