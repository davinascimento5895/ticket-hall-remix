import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Política de Privacidade — TicketHall"
        description="Entenda como a TicketHall coleta, armazena e utiliza seus dados pessoais em conformidade com a LGPD."
      />
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="container max-w-3xl space-y-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 1 de março de 2026</p>

          <section className="space-y-4 text-muted-foreground leading-relaxed">
            <h2 className="font-display text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              A TicketHall ("nós", "nosso") está comprometida com a proteção dos dados pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Dados de cadastro:</strong> nome completo, CPF, e-mail, telefone.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Dados de pagamento:</strong> informações de cartão de crédito (processadas por parceiros PCI-DSS), dados de PIX.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, cookies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Dados de evento:</strong> ingressos adquiridos, histórico de check-in, preferências de evento.</span>
              </li>
            </ul>

            <h2 className="font-display text-xl font-semibold text-foreground">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Processar compras de ingressos e pagamentos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Enviar confirmações, QR codes e notificações sobre eventos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Melhorar a experiência do usuário e personalizar recomendações.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Cumprir obrigações legais e regulatórias.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Prevenir fraudes e garantir a segurança da plataforma.</span>
              </li>
            </ul>

            <h2 className="font-display text-xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p>
              Seus dados podem ser compartilhados com: produtores de eventos (apenas dados necessários para o evento), processadores de pagamento homologados, e autoridades competentes quando exigido por lei. Não vendemos dados pessoais a terceiros.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">5. Armazenamento e Segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">6. Seus Direitos (LGPD)</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Confirmar a existência de tratamento de dados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Acessar, corrigir ou excluir seus dados pessoais.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Solicitar portabilidade dos dados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Revogar consentimento a qualquer momento.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Solicitar a anonimização ou eliminação de dados desnecessários.</span>
              </li>
            </ul>
            <p>
              Para exercer seus direitos, acesse a seção "Privacidade" em sua conta ou envie um e-mail para <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">7. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para melhorar nossos serviços. Você pode gerenciar suas preferências de cookies nas configurações do navegador.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pelo período necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei. Dados de transações financeiras são mantidos por no mínimo 5 anos para fins fiscais e regulatórios.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou notificação na plataforma. Recomendamos revisá-la regularmente.
            </p>

            <h2 className="font-display text-xl font-semibold text-foreground">10. Contato</h2>
            <p>
              Para dúvidas sobre esta Política ou sobre o tratamento de seus dados, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
