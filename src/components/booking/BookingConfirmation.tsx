import { Check, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Props {
  orderId: string | null;
  eventTitle: string;
  onGoToTickets: () => void;
  onClose: () => void;
}

export function BookingConfirmation({ orderId, eventTitle, onGoToTickets, onClose }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
      >
        <Check className="h-10 w-10 text-green-500" strokeWidth={3} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="text-xl font-bold">Compra confirmada!</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Seus ingressos para <span className="font-medium text-foreground">{eventTitle}</span> foram gerados com sucesso.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground"
      >
        <Mail className="h-4 w-4 shrink-0" />
        <span>Enviamos os ingressos para seu e-mail</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full space-y-3 pt-2"
      >
        <Button className="w-full gap-2" size="lg" onClick={onGoToTickets}>
          <Ticket className="h-4 w-4" />
          Ver meus ingressos
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Voltar ao evento
        </Button>
      </motion.div>
    </div>
  );
}
