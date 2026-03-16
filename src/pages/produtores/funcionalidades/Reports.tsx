import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Reports() {
  return (
    <>
      <SEOHead title="Funcionalidades — Relatórios" description="Relatórios e análises detalhadas para entender suas vendas e público." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/relatorios" className="font-bold">Relatórios</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Relatórios & Análises</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Gráficos, filtros e exportações para estudar desempenho por período, categoria e campanha.</p>

        <section className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Evolução diária</h3>
              <p className="text-sm text-muted-foreground mt-2">Gráfico de vendas por hora/dia para identificar picos, janelas de conversão e o impacto de campanhas.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Preferências do público</h3>
              <p className="text-sm text-muted-foreground mt-2">Segmentação por categoria, faixa etária, cidade e dispositivo — útil para ajustar comunicação e publicidade.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold">Desempenho detalhado</h3>
              <p className="text-sm text-muted-foreground mt-2">Tabelas exportáveis com vendas por lote, reembolso, cupom utilizado e canal de venda.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Como usar os relatórios (passo a passo)</h3>
            <ol className="list-decimal pl-5 text-muted-foreground mt-2">
              <li>Selecione o período desejado (últimos 7, 30 dias ou intervalo personalizado).</li>
              <li>Filtre por evento, lote ou canal para comparar performance segmentada.</li>
              <li>Analise picos de tráfego e correlacione com campanhas (UTM) para otimizar investimento.</li>
              <li>Exporte CSV/PDF para contabilidade ou integração com ERP.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li><strong>Financeiro:</strong> conciliação diária e conferência de repasses para contabilidade.</li>
              <li><strong>Marketing:</strong> otimização de campanhas com base em conversão por origem.</li>
              <li><strong>Operação:</strong> prever filas e dimensionar staff com base em vendas por horário.</li>
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
