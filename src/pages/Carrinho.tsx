import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountdownTimer } from "@/components/CountdownTimer";
import { EmptyState } from "@/components/EmptyState";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { validateCoupon } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Carrinho() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, platformFee, total, expiresAt } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const navigate = useNavigate();

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || items.length === 0) return;
    setValidatingCoupon(true);
    try {
      const eventId = items[0].eventId;
      const coupon = await validateCoupon(eventId, couponCode);
      if (coupon) {
        const discountAmount =
          coupon.discount_type === "percentage"
            ? subtotal * (coupon.discount_value / 100)
            : coupon.discount_value;
        setDiscount(Math.min(discountAmount, subtotal));
        toast({ title: "Cupom aplicado!", description: `Desconto de R$ ${discountAmount.toFixed(2).replace(".", ",")}` });
      }
    } catch {
      toast({ title: "Cupom inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
      setDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, total - discount);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (items.length === 0) {
    return (
      <>
        <div className="container pt-4 md:pt-24 pb-16">
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title="Seu carrinho está vazio"
            description="Explore os eventos disponíveis e adicione ingressos ao seu carrinho."
            actionLabel="Ver eventos"
            onAction={() => navigate("/eventos")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container pt-4 md:pt-24 pb-16">
        <Link to="/eventos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Carrinho</h1>
          {expiresAt && <CountdownTimer expiresAt={expiresAt} onExpire={clearCart} />}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items */}
          <div className="flex-1 space-y-3">
            {items.map((item) => (
              <div key={item.tierId} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
                {item.coverImageUrl && (
                  <img src={item.coverImageUrl} alt="" className="w-16 h-16 rounded object-cover hidden sm:block" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground truncate">{item.eventTitle}</p>
                  <p className="text-sm text-muted-foreground">{item.tierName}</p>
                  <p className="text-sm font-medium text-foreground">{fmt(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.tierId, Number(e.target.value))}
                    className="bg-secondary text-foreground text-sm rounded px-2 py-1 border border-border"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(item.tierId)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="p-5 rounded-lg border border-border bg-card space-y-4">
              <h3 className="font-display font-semibold text-foreground">Resumo</h3>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  placeholder="Cupom de desconto"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleValidateCoupon} disabled={validatingCoupon}>
                  Aplicar
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de serviço (7%)</span>
                  <span className="text-foreground">{fmt(platformFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto</span>
                    <span>-{fmt(discount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{fmt(finalTotal)}</span>
                </div>
              </div>

              <Button className="w-full" asChild>
                <Link to="/checkout">Finalizar compra</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
