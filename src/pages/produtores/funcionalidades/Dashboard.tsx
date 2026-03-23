import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <>
      <SEOHead title="Funcionalidades — Dashboard" description="Dashboard com vendas, ingressos confirmados e métricas em tempo real." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/dashboard" className="font-bold">Dashboard</Link>
        </nav>
        <div className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Dashboard — Visão geral de vendas</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Tenha clareza total sobre vendas, receita e performance do seu evento em um único painel.
          </p>
        </div>
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold">O que inclui o Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
              O Dashboard consolida as métricas essenciais do seu evento em blocos visuais: resumo de vendas, receita líquida, ingressos confirmados,
              conversões por canal, e alertas operacionais (estornos, ordens suspensas, baixa de estoque). A informação é apresentada com filtros por período
              e segmentação por lote, canal de venda e cidade.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Resumo financeiro</h3>
              <p className="text-sm text-muted-foreground mt-2">Saldo confirmado, vendas do período, taxas aplicadas e previsão de repasses.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Ingressos vendidos</h3>
              <p className="text-sm text-muted-foreground mt-2">Contagem por tipo de ingresso, porcentagem de ocupação e ingressos gratuitos x pagos.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Principais canais</h3>
              <p className="text-sm text-muted-foreground mt-2">Origem das vendas (site, widget, afiliados, redes sociais) e taxa de conversão por canal.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li><strong>Monitoramento diário:</strong> equipe de operações acompanha picos de venda e volumes de check-in em tempo real.</li>
              <li><strong>Conciliação financeira:</strong> conferência rápida de valores a receber vs valores pagos por compradores.</li>
              <li><strong>Otimização de marketing:</strong> identifique canais com melhor CAC e direcione orçamento para onde funciona.</li>
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

          <div className="pt-4">
            <Button asChild>
              <a href="/produtores">Voltar para Produtores <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
