import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Payouts() {
  return (
    <>
      <SEOHead title="Funcionalidades — Repasses e Contas Bancárias" description="Configuração de contas bancárias e acompanhamento de repasses." />

      <div className="container pt-24 pb-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Repasses e contas bancárias</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Configure contas bancárias para recebimento, defina cronogramas de repasse e acompanhe o histórico de pagamentos.</p>

        <section className="space-y-6">
          <div>
            <h3 className="font-semibold">Funcionalidades</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Cadastro de contas bancárias por produtor</li>
              <li>Criação de cronogramas de repasse (diário/semanal/mensal)</li>
              <li>Histórico detalhado de repasses e taxas aplicadas</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Recebimento automático em conta do produtor após conciliação</li>
              <li>Configuração de conta escopo por evento ou organizador</li>
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
