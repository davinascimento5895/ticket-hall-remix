import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Guestlist() {
  return (
    <>
      <SEOHead title="Funcionalidades — Listas de acesso e Guestlist" description="Gerencie listas de convidados e credenciais especiais." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/guestlist" className="font-bold">Listas de acesso</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Listas de acesso e guestlist</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Gerencie convites, credenciais e listas separadas para imprensa, patrocinadores e convidados VIP.</p>

        <section className="space-y-6">
          <div>
            <h3 className="font-semibold">Funcionalidades</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Importação de listas (CSV) com campos customizáveis</li>
              <li>Exportação e integração com sistemas de credenciamento</li>
              <li>Controle de entradas por lista e relatórios de presença</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Convidados de imprensa com acesso prioritário</li>
              <li>Lista de patrocinadores e credenciais permanentes</li>
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
