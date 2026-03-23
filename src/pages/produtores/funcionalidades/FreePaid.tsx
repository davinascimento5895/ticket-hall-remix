import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FreePaid() {
  return (
    <>
      <SEOHead title="Funcionalidades — Ingressos gratuitos e pagos" description="Suporte a ingressos gratuitos, pagos e mistos com gestão de estoque." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/free-paid" className="font-bold">Ingressos gratuitos e pagos</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Ingressos gratuitos e pagos</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Venda ingressos pagos, ofereça cortesias e combine modelos híbridos (gratuito + pago) mantendo controle de estoque e relatórios.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Principais capacidades</h2>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Ingressos totalmente gratuitos com limite de emissão</li>
              <li>Ingressos pagos com integração a meios de pagamento</li>
              <li>Modelos mistos — por exemplo, um lote gratuito e outro pago no mesmo evento</li>
              <li>Controle de estoque separado por tipo (gratuito x pago)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Distribuição de cortesias para imprensa e parceiros.</li>
              <li>Testes de demanda: libere ingressos gratuitos por tempo limitado para medir interesse.</li>
              <li>Ofertas combinadas: ingresso pago + cupom para acompanhante gratuito.</li>
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
