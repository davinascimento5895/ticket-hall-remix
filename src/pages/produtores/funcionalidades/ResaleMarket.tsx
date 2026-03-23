import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ResaleMarket() {
  return (
    <>
      <SEOHead title="Funcionalidades — Marketplace de Revenda" description="Espaço seguro para revenda quando permitido pelo produtor." />

      <div className="container pt-24 pb-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Marketplace de revenda</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Ambiente controlado para revenda, com regras definidas pelo produtor e proteção contra fraudes.</p>

        <section className="space-y-6">
          <div>
            <h3 className="font-semibold">Recursos</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Listagem oficial de ingressos para revenda</li>
              <li>Validação de titularidade e emissão de QR substituto</li>
              <li>Taxas e regras configuráveis pelo organizador</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Oferecer uma alternativa segura ao mercado secundário</li>
              <li>Permitir revenda controlada com apoio do produtor</li>
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
