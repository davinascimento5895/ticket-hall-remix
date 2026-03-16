import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Cashflow() {
  return (
    <>
      <SEOHead title="Funcionalidades — Fluxo de caixa e conciliação" description="Painel financeiro com fluxo de caixa, contas a pagar/receber e conciliação por evento." />

      <div className="container pt-24 pb-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Fluxo de caixa e conciliação</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Ferramentas para controlar entradas, saídas e promover conciliação por evento para facilitar a contabilidade.</p>

        <section className="space-y-6">
          <div>
            <h3 className="font-semibold">Recursos</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Visão de fluxo de caixa consolidada</li>
              <li>Contas a pagar/receber por evento</li>
              <li>Ferramentas de conciliação automática</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Conciliação mensal para repasses</li>
              <li>Identificação de discrepâncias entre vendas e repasses</li>
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
