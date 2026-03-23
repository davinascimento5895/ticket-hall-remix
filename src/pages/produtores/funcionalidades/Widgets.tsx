import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Widgets() {
  return (
    <>
      <SEOHead title="Funcionalidades — Widgets e Embed" description="Venda ingressos através de widgets embutidos em sites externos." />

      <div className="container pt-24 pb-16">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Widgets e embed</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Ofereça uma experiência de checkout embutida em seu site com widgets responsivos e integração simples.</p>

        <section className="space-y-6">
          <div>
            <h3 className="font-semibold">Capacidades</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Widget de compra embutido (iframe ou script)</li>
              <li>Customização de cores e textos</li>
              <li>Suporte a múltiplos eventos em uma mesma página</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Venda direta no site do produtor sem redirecionar o usuário</li>
              <li>Campanhas em landing pages com checkout otimizado</li>
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
