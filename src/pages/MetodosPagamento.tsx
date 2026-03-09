import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, CreditCard, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedCard {
  id: string;
  last4: string;
  brand: "visa" | "mastercard" | "other";
}

const brandLabels: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  other: "Cartão",
};

export default function MetodosPagamento() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[]>([
    // Mock data for demonstration
  ]);
  const [editMode, setEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New card form
  const [cardNumber, setCardNumber] = useState("");
  const [validity, setValidity] = useState("");
  const [cvv, setCvv] = useState("");
  const [adding, setAdding] = useState(false);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatValidity = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleAddCard = async () => {
    if (!cardNumber || !validity || !cvv) {
      toast.error("Preencha todos os campos");
      return;
    }
    setAdding(true);
    // Simulate adding — in production this would go through a payment gateway
    await new Promise((r) => setTimeout(r, 800));
    const digits = cardNumber.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    const brand = digits.startsWith("4") ? "visa" : digits.startsWith("5") ? "mastercard" : "other";
    setCards((prev) => [...prev, { id: crypto.randomUUID(), last4, brand }]);
    setCardNumber("");
    setValidity("");
    setCvv("");
    setShowAddForm(false);
    setAdding(false);
    toast.success("Cartão adicionado!");
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cartão removido");
  };

  return (
    <>
      <SEOHead title="Métodos de Pagamento | TicketHall" description="Gerencie seus métodos de pagamento" />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Métodos de pagamento
          </h1>
          {cards.length > 0 ? (
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-sm font-medium text-primary"
            >
              {editMode ? "OK" : "Editar"}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-4">
          {/* Add New Card Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">
              Novo cartão
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Card List */}
          {cards.length === 0 && !showAddForm && (
            <div className="text-center py-12 space-y-3">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
            </div>
          )}

          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-xl bg-muted/50 transition-all",
                editMode && "pr-2"
              )}
            >
              <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {brandLabels[card.brand]} •••• {card.last4}
                </span>
              </div>
              {editMode ? (
                <button
                  onClick={() => handleRemoveCard(card.id)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  aria-label="Remover cartão"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              ) : null}
            </div>
          ))}

          {/* Add Card Form */}
          {showAddForm && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
              <h3 className="text-sm font-semibold text-foreground">Novo cartão</h3>
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-xs text-muted-foreground">
                  Número do cartão
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="validity" className="text-xs text-muted-foreground">
                    Validade
                  </Label>
                  <Input
                    id="validity"
                    placeholder="MM/AA"
                    value={validity}
                    onChange={(e) => setValidity(formatValidity(e.target.value))}
                    maxLength={5}
                    className="bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-xs text-muted-foreground">
                    Código
                  </Label>
                  <Input
                    id="cvv"
                    placeholder="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddForm(false);
                    setCardNumber("");
                    setValidity("");
                    setCvv("");
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleAddCard} disabled={adding}>
                  {adding ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
