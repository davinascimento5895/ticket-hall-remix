import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowLeft, LogIn, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountdownTimer } from "@/components/CountdownTimer";
import { EmptyState } from "@/components/EmptyState";
import { AuthModal } from "@/components/AuthModal";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { validateCoupon } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Carrinho() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, platformFee, total, expiresAt, couponCode, setCouponCode, discount, setDiscount, setAppliedCouponId, finalTotal } = useCart();
  const { user } = useAuth();
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const navigate = useNavigate();

  // Validate availability on mount
  useEffect(() => {
    if (items.length === 0) return;
    const tierIds = items.map(i => i.tierId).filter(id => !id.startsWith("product-"));
    if (tierIds.length === 0) return;

    supabase
      .from("ticket_tiers")
      .select("id, quantity_total, quantity_sold, quantity_reserved")
      .in("id", tierIds)
      .then(({ data }) => {
        if (!data) return;
        const unavailable: string[] = [];
        for (const item of items) {
          if (item.tierId.startsWith("product-")) continue;
          const tier = data.find(t => t.id === item.tierId);
          if (!tier) {
            unavailable.push(item.tierId);
            continue;
          }
          const available = tier.quantity_total - (tier.quantity_sold ?? 0) - (tier.quantity_reserved ?? 0);
          if (available < item.quantity) {
            unavailable.push(item.tierId);
          }
        }
        setUnavailableItems(unavailable);
        if (unavailable.length > 0) {
          toast({
            title: "Disponibilidade alterada",
            description: "Alguns ingressos no carrinho podem não estar mais disponíveis.",
            variant: "destructive",
          });
        }
      });
  }, []); // Only on mount

  const handleCheckout = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    navigate("/checkout");
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || items.length === 0) return;
    setValidatingCoupon(true);
    try {
      const eventId = items[0].eventId;
      const coupon = await validateCoupon(eventId, couponCode);
      if (coupon) {
        // Check minimum order value
        if (coupon.min_order_value && subtotal < coupon.min_order_value) {
          toast({ title: "Valor mínimo não atingido", description: `Este cupom requer pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2).replace(".", ",")}.`, variant: "destructive" });
          setValidatingCoupon(false);
          return;
        }
        // Check applicable tiers
        if (coupon.applicable_tier_ids && coupon.applicable_tier_ids.length > 0) {
          const cartTierIds = items.map(i => i.tierId);
          const hasValidTier = cartTierIds.some(tid => coupon.applicable_tier_ids!.includes(tid));
          if (!hasValidTier) {
            toast({ title: "Cupom não aplicável", description: "Este cupom não é válido para os ingressos no carrinho.", variant: "destructive" });
            setValidatingCoupon(false);
            return;
          }
        }
        const discountAmount =
          coupon.discount_type === "percentage"
            ? subtotal * (coupon.discount_value / 100)
            : coupon.discount_value;
        setDiscount(Math.min(discountAmount, subtotal));
        setAppliedCouponId(coupon.id);
        toast({ title: "Cupom aplicado!", description: `Desconto de R$ ${discountAmount.toFixed(2).replace(".", ",")}` });
      }
    } catch (err: any) {
      toast({ title: "Cupom inválido", description: err?.message || "Verifique o código e tente novamente.", variant: "destructive" });
      setDiscount(0);
      setAppliedCouponId(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (items.length === 0) {
    return (
      <>
        <div className="container pt-4 lg:pt-24 pb-16">
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
      <div className="container pt-4 lg:pt-24 pb-16">
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
                    {Array.from({ length: item.maxPerOrder || 10 }, (_, i) => i + 1).map((n) => (
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
                  <span className="text-muted-foreground">Taxa de serviço ({items[0]?.platformFeePercent ?? 7}%)</span>
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

              {!user && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  <span>Você precisará fazer login para finalizar a compra.</span>
                </div>
              )}

              <Button className="w-full" onClick={handleCheckout}>
                Finalizar compra
              </Button>

              <AuthModal
                open={showAuth}
                onOpenChange={(open) => {
                  setShowAuth(open);
                  // After closing, if user is now logged in, go to checkout
                  if (!open && user) {
                    navigate("/checkout");
                  }
                }}
                redirectTo="/checkout"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
