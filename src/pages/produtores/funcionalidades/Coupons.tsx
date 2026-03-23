import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Coupons() {
  return (
    <>
      <SEOHead title="Funcionalidades — Cupons" description="Crie e gerencie cupons de desconto com restrições e limites." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/cupons" className="font-bold">Cupons</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Cupons e Promoções</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Crie descontos por percentual ou valor fixo, limite por uso e períodos de validade.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Tipos de cupons</h2>
            <p className="text-sm text-muted-foreground mt-2">Suportamos cupons por percentual, valor fixo, envio por trecho de lote e restrição por categoria de ingresso ou por cidade.</p>
          </div>

          <div>
            <h3 className="font-semibold">Regras avançadas</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Limite de uso global (ex.: primeiros 100 usos)</li>
              <li>Limite por comprador (ex.: 1 cupom por CPF)</li>
              <li>Validade por período ou por lote específico</li>
              <li>Compatibilidade com outras promoções (stackable / non-stackable)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <p className="text-sm text-muted-foreground mt-2">Cupons são úteis para: lançamento (early-bird), parcerias (promoters com códigos exclusivos), recuperação de carrinho (email com desconto) e campanhas segmentadas (cupom apenas para uma cidade).</p>
          </div>

          <div>
            <h3 className="font-semibold">Boas práticas</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Defina validade curta para promoções de lançamento.</li>
              <li>Use limites por comprador para evitar abuso.</li>
              <li>Monitore conversões por cupom nos relatórios para avaliar ROI.</li>
            </ul>
          </div>

          <section className="mt-6">
            <h3 className="font-semibold mb-4">Placeholders de prints</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">Anexar print 1</div>
              <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">Anexar print 2</div>
              <div className="h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">Anexar print 3</div>
            </div>
          </section>

          <div className="pt-6">
            <Button asChild>
              <a href="/produtores">Voltar para Produtores <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
