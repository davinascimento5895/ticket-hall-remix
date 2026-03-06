import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CheckoutStepConfirmationProps {
  orderId?: string | null;
}

export function CheckoutStepConfirmation({ orderId }: CheckoutStepConfirmationProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-success" />
      </div>
      <h2 className="font-display text-2xl font-bold">Pedido confirmado!</h2>
      {orderId && (
        <p className="text-sm text-muted-foreground font-mono">
          Pedido #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}
      <p className="text-muted-foreground max-w-md mx-auto">
        Seus ingressos foram gerados com sucesso. Você pode acessá-los na seção
        "Meus Ingressos".
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/meus-ingressos">Ver meus ingressos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/eventos">Explorar mais eventos</Link>
        </Button>
      </div>
    </div>
  );
}
