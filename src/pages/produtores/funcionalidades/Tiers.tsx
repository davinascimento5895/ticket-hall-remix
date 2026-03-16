import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Tiers() {
  return (
    <>
      <SEOHead title="Funcionalidades — Ingressos e Lotes" description="Crie e gerencie lotes, tipos de ingresso e regras de venda." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/tiers" className="font-bold">Ingressos e Lotes</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Configuração de ingressos e lotes (tiers)</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Crie diferentes tipos de ingresso com preços, quantidades e regras independentes para controlar vendas por fase e segmento de público.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">O que você pode configurar</h2>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li>Nome do lote (ex.: Early Bird, Pista, Camarote)</li>
              <li>Preço do ingresso e preço promocional</li>
              <li>Quantidade disponível e limite por comprador</li>
              <li>Visibilidade por período (apenas entre datas específicas)</li>
              <li>Regras de elegibilidade (CPF, idade, códigos promocionais)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Como usar (passo a passo)</h3>
            <ol className="list-decimal pl-5 text-muted-foreground mt-2">
              <li>Crie um novo lote e defina o nome e o preço.</li>
              <li>Defina a quantidade máxima disponível e limites por CPF/cliente.</li>
              <li>Configure a janela de venda (ex.: Early Bird apenas 7 dias).</li>
              <li>Associe regras de visibilidade e restrições por canal se necessário.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li><strong>Lançamento em fases:</strong> libere um lote com preço reduzido para os primeiros compradores e aumente o preço ao esgotar.</li>
              <li><strong>Controle por público:</strong> módulos VIP com limite por comprador e benefícios especiais.</li>
              <li><strong>Revalidação:</strong> desative vendas para um lote e conserve histórico para conciliação.</li>
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
