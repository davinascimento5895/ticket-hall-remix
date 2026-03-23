import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function TransferResale() {
  return (
    <>
      <SEOHead title="Funcionalidades — Transferência e Revenda por Usuário" description="Transferência de titularidade e listagem para revenda quando habilitado." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/transferencia-revenda" className="font-bold">Transferência e revenda</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Transferência e revenda por usuário</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Permita que compradores transfiram ingressos para terceiros ou listem para revenda no marketplace quando autorizado.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Processos suportados</h2>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Transferência simples entre contas (com notificação)</li>
              <li>Revalidação de QR e controle de titularidade</li>
              <li>Políticas de revenda aplicadas pelo produtor</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Vendedor transfere ingresso para comprador escolhido</li>
              <li>Venda no marketplace com repasse automático</li>
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
