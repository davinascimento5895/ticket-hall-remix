import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Sales() {
  return (
    <>
      <SEOHead title="Funcionalidades — Vendas" description="Gestão de vendas, ingressos, reembolsos e repasses." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/vendas" className="font-bold">Vendas</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Gestão de Vendas</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Controle vendas, visualização de ingressos vendidos e histórico de repasses.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Tipos de ingressos e lotes</h2>
            <p className="text-sm text-muted-foreground mt-2">Crie lotes com preço, quantidade e visibilidade independentes (ex.: Early Bird, Pista, Camarote). Cada lote pode ter regras de venda — limite por comprador, disponibilidade por período e compra mínima.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Fluxo de vendas</h3>
              <p className="text-sm text-muted-foreground mt-2">Acompanhamento em tempo real das ordens — status (pendente, aprovado, cancelado), dados do comprador, método de pagamento e qualquer anomalia que exija intervenção manual.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Repasses e histórico</h3>
              <p className="text-sm text-muted-foreground mt-2">Detalhamento de repasses por evento: valores brutos, taxas cobradas, retenções e calendário de pagamento. Exportável para integração contábil.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Reembolsos e estornos</h3>
            <p className="text-sm text-muted-foreground mt-2">Processo de reembolso configurável: reembolso total, parcial ou via crédito na plataforma. Ferramentas para registrar motivos e comunicar comprador automaticamente.</p>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso e exemplos</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li><strong>Lançamento por fases:</strong> abra um lote Early Bird por 1 semana, depois um lote normal — controle de quantidades e preços por lote.</li>
              <li><strong>Promoção limitada:</strong> crie um cupom com uso limitado e associe à campanha de e-mail; monitore conversões no relatório.</li>
              <li><strong>Repasses mensais:</strong> eventos com repasses automatizados semanalmente, com relatório anexado para equipe financeira.</li>
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
