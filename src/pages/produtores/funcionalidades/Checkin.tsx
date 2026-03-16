import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Checkin() {
  return (
    <>
      <SEOHead title="Funcionalidades — Check-in" description="Ferramentas de check-in com QR Code e operação offline." />

      <div className="container pt-24 pb-16">
        <nav className="text-sm mb-3">
          <Link to="/" className="text-muted-foreground hover:underline">Home</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades" className="text-muted-foreground hover:underline">Funcionalidades</Link>
          <span className="px-2 text-muted-foreground">›</span>
          <Link to="/produtores/funcionalidades/checkin" className="font-bold">Check-in</Link>
        </nav>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Check-in Rápido</h1>
        <p className="text-muted-foreground max-w-2xl mb-6">Leitura de QR Code, validação em lote e operação mesmo sem internet.</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Modo offline e leitura em massa</h2>
            <p className="text-sm text-muted-foreground mt-2">Nos ambientes com conexão limitada, o app guarda leituras localmente e sincroniza quando o dispositivo reconectar. Suporte a leitura em lote para agilizar filas.</p>
          </div>

          <div>
            <h3 className="font-semibold">Validação e tratamento de exceções</h3>
            <p className="text-sm text-muted-foreground mt-2">Identificação imediata de QR Codes inválidos, reutilizados ou bloqueados. Fluxo de cancelamento, substituição de titular e emissão de passes para credenciais.</p>
          </div>

          <div>
            <h3 className="font-semibold">Casos de uso</h3>
            <ul className="list-disc pl-5 text-muted-foreground mt-2">
              <li><strong>Entrada rápida:</strong> mil pessoas por hora com múltiplas portas e estações de leitura.</li>
              <li><strong>Offline em sítios:</strong> eventos em locais sem 4G — check-in contínuo e sincronização pós-evento.</li>
              <li><strong>Lista VIP:</strong> liberação automática de acessos em listas de convidados/guestlist.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <strong>Integrações:</strong>
            <p className="text-sm text-muted-foreground mt-2">Exporte logs de check-in, conecte-se a leitores externos via Bluetooth/USB (quando disponível) e integre com sistemas de controle de acesso.</p>
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
