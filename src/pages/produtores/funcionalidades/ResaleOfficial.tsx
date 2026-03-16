import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ResaleOfficial() {
  return (
    <>
      <SEOHead title="Funcionalidades — Revenda oficial" description="Marketplace integrado para revenda de ingressos quando permitido pelo produtor." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/revenda-oficial" className="font-bold">Revenda oficial</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Revenda oficial (marketplace)</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Uma solução segura para permitir que compradores revendam seus ingressos autorizados pela organização do evento.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Como funciona</h2>
            <p className="text-sm text-muted-foreground mt-2">Quando habilitado, compradores podem listar ingressos para revenda; o sistema valida titularidade, invalida QR anterior e gera novo QR para o comprador subsequente, garantindo segurança e rastreabilidade.</p>
          </div>

          <div>
            <h3 className="font-semibold">Regras e controles</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Aprovação do produtor para permitir revenda</li>
              <li>Limites de preço ou taxa administrativa sobre o vendedor</li>
              <li>Validação automática de fraudes e checagens de duplicidade</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Redução de fraudes em revendas entre usuários</li>
              <li>Recuperação de valor para compradores que não podem comparecer</li>
              <li>Mercado controlado pela organização com regras claras</li>
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
