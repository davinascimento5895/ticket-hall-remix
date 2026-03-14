import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

export default function MetodosPagamento() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Métodos de Pagamento | TicketHall" description="Informações sobre métodos de pagamento" />

      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Métodos de pagamento
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12">
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Pagamento na hora da compra</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Os dados de pagamento são inseridos diretamente no checkout de cada compra.
              Não é necessário cadastrar cartões previamente.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Seus dados são processados de forma segura pelo gateway de pagamento</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-medium text-foreground">Formas de pagamento aceitas</h3>
            <div className="space-y-2">
              {[
                { label: "PIX", description: "Pagamento instantâneo, sem taxa adicional" },
                { label: "Cartão de crédito", description: "Parcelamento disponível conforme o evento" },
                { label: "Boleto bancário", description: "Prazo de compensação de 1 a 3 dias úteis" },
              ].map((method) => (
                <div key={method.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
                  <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
