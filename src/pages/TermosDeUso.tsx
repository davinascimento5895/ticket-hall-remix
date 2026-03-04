import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Termos de Uso — TicketHall"
        description="Leia os Termos de Uso da plataforma TicketHall. Saiba seus direitos e deveres ao utilizar nossos serviços de venda de ingressos online."
      />
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="container max-w-3xl space-y-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 1 de março de 2026</p>

          <section className="space-y-4 text-muted-foreground leading-relaxed">
            <h2 className="font-display text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma TicketHall ("Plataforma"), você concorda com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize nossos serviços. A utilização contínua da Plataforma após eventuais alterações constitui aceitação dos novos termos.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              A TicketHall é uma plataforma de venda de ingressos online que conecta produtores de eventos a compradores. Oferecemos ferramentas para criação, gestão e divulgação de eventos, bem como processamento de pagamentos via PIX, cartão de crédito e boleto bancário.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">3. Cadastro e Conta</h2>
            <p>
              Para utilizar determinadas funcionalidades, é necessário criar uma conta fornecendo informações verdadeiras e completas. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">4. Taxas e Pagamentos</h2>
            <p>
              A TicketHall cobra uma taxa de serviço de 7% sobre o valor de cada ingresso vendido, que pode ser absorvida pelo produtor ou repassada ao comprador, conforme configuração do evento. Os pagamentos são processados por meio de parceiros de pagamento homologados.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">5. Política de Cancelamento e Reembolso</h2>
            <p>
              Cancelamentos e reembolsos seguem as políticas definidas por cada produtor de evento, respeitando o Código de Defesa do Consumidor (Lei nº 8.078/90). Em caso de cancelamento do evento pelo produtor, o reembolso integral será processado automaticamente no método de pagamento original em até 30 dias úteis.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">6. Responsabilidades do Usuário</h2>
            <p>
              O usuário compromete-se a utilizar a Plataforma de forma ética e legal, não realizar fraudes, não revender ingressos acima do valor nominal (salvo quando habilitado pelo produtor) e não utilizar mecanismos automatizados para compra em massa.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma — incluindo marca, logotipos, layout, software e textos — é propriedade da TicketHall ou de seus licenciadores. É proibida a reprodução, distribuição ou modificação sem autorização prévia por escrito.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>
              A TicketHall atua como intermediária entre produtores e compradores. Não nos responsabilizamos pela realização, qualidade ou segurança dos eventos. A responsabilidade pelo evento é exclusiva do produtor organizador.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">9. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na Plataforma com antecedência mínima de 15 dias.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">10. Foro</h2>
            <p>
              Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
