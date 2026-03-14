import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Calendar, CreditCard, MapPin, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyOrders } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { formatBRL } from "@/lib/utils";

export default function MeusPedidos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => getMyOrders(user!.id),
    enabled: !!user?.id,
  });

  const paymentMethodLabel = (method: string | null) => {
    switch (method) {
      case "credit_card": return "Cartão de crédito";
      case "pix": return "PIX";
      case "boleto": return "Boleto";
      default: return method || "—";
    }
  };

  return (
    <>
      <SEOHead title="Meus Pedidos" description="Histórico de pedidos na TicketHall." />
      <div className="container pt-4 lg:pt-24 pb-16">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-6">Meus Pedidos</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Nenhum pedido encontrado"
            description="Seus pedidos aparecerão aqui após a primeira compra."
            actionLabel="Explorar eventos"
            onAction={() => navigate("/eventos")}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const event = order.events;
              return (
                <Link
                  key={order.id}
                  to={`/pedido/${order.id}`}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  {/* Event image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 hidden sm:block">
                    {event?.cover_image_url ? (
                      <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground truncate">{event?.title || "Evento"}</h3>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {order.payment_method && (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-primary" />
                          {paymentMethodLabel(order.payment_method)}
                        </span>
                      )}
                      {event?.venue_city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {event.venue_city}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground">
                      {formatBRL(order.total)}
                      {order.installments && order.installments > 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({order.installments}x de {formatBRL(order.installment_value || order.total / order.installments)})
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-muted-foreground font-mono">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
