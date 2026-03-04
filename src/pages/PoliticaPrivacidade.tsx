import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, Database, Target, Users, Lock,
  Scale, Cookie, Clock, Globe, Mail
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "coleta", label: "Dados Coletados", icon: Database },
  { id: "finalidade", label: "Finalidade", icon: Target },
  { id: "compartilhamento", label: "Compartilhamento", icon: Users },
  { id: "armazenamento", label: "Armazenamento e Segurança", icon: Lock },
  { id: "direitos", label: "Seus Direitos (LGPD)", icon: Scale },
  { id: "cookies", label: "Cookies", icon: Cookie },
  { id: "retencao", label: "Retenção de Dados", icon: Clock },
  { id: "internacional", label: "Transferência Internacional", icon: Globe },
  { id: "contato", label: "Contato e DPO", icon: Mail },
];

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function Clause({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <Badge variant="outline" className="shrink-0 h-6 text-xs font-mono">{number}</Badge>
      <p className="text-muted-foreground leading-relaxed text-sm">{children}</p>
    </div>
  );
}

function BulletList({ items }: { items: { bold?: string; text: string }[] }) {
  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-sm text-muted-foreground">
            {item.bold && <strong className="text-foreground">{item.bold}</strong>}
            {item.bold ? " " : ""}{item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PoliticaPrivacidade() {
  const [activeTab, setActiveTab] = useState("coleta");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Política de Privacidade — TicketHall"
        description="Entenda como a TicketHall coleta, armazena e utiliza seus dados pessoais em conformidade com a LGPD."
      />
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">Política de Privacidade</h1>
            </div>
            <p className="text-muted-foreground">
              Última atualização: 1 de março de 2026
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              A TicketHall está comprometida com a proteção dos dados pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4">
              <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 justify-start">
                {sections.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5 px-3 py-2 rounded-full border border-border data-[state=active]:border-primary"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(" ")[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* 1. Dados Coletados */}
            <TabsContent value="coleta">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Database} title="1. Dados Coletados" />
                  <Clause number="1.1">
                    Durante a utilização da plataforma TicketHall, dados pessoais poderão ser coletados em diferentes momentos, como ao criar uma conta, adquirir ingressos, cadastrar eventos ou navegar pela plataforma. Para cada tipo de dado coletado, adotamos um nível de proteção adequado.
                  </Clause>
                  <p className="text-sm text-muted-foreground ml-1">Coletamos os seguintes tipos de dados:</p>
                  <BulletList items={[
                    { bold: "Dados de cadastro:", text: "nome completo, CPF, e-mail, telefone, data de nascimento." },
                    { bold: "Dados de pagamento:", text: "informações de cartão de crédito (processadas por parceiros PCI-DSS), dados de PIX e boleto. A TicketHall não armazena dados completos de cartão de crédito." },
                    { bold: "Dados de navegação:", text: "endereço IP, tipo de navegador, páginas visitadas, cookies, identificadores de dispositivo." },
                    { bold: "Dados de evento:", text: "ingressos adquiridos, histórico de check-in, preferências de evento, dados de participantes informados pelo comprador." },
                    { bold: "Dados do Produtor:", text: "CNPJ/CPF, dados bancários para repasse, informações do evento, dados de equipe e colaboradores." },
                    { bold: "Dados biométricos (quando aplicável):", text: "em processos de verificação de identidade para prevenção a fraudes, mediante consentimento." },
                  ]} />
                  <Clause number="1.2">
                    A TicketHall também coleta dados não pessoais, como informações agregadas de uso da plataforma, estatísticas de navegação e dados técnicos de desempenho, que não permitem a identificação direta do usuário.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. Finalidade */}
            <TabsContent value="finalidade">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Target} title="2. Finalidade do Tratamento" />
                  <Clause number="2.1">
                    Utilizamos seus dados para as seguintes finalidades:
                  </Clause>
                  <BulletList items={[
                    { text: "Processar compras de ingressos, pagamentos e emitir confirmações." },
                    { text: "Enviar QR Codes, notificações sobre eventos e lembretes." },
                    { text: "Melhorar a experiência do usuário e personalizar recomendações de eventos." },
                    { text: "Cumprir obrigações legais e regulatórias, incluindo obrigações fiscais." },
                    { text: "Prevenir fraudes, cambismo e garantir a segurança da plataforma." },
                    { text: "Realizar análises de risco em transações financeiras." },
                    { text: "Comunicar-se com o usuário sobre atualizações, alterações em eventos e suporte." },
                    { text: "Gerenciar o cadastro de Produtores e processar repasses financeiros." },
                    { text: "Gerar certificados de participação em eventos, quando habilitado." },
                    { text: "Cumprir determinações de autoridades competentes." },
                  ]} />
                  <Clause number="2.2">
                    As bases legais utilizadas para o tratamento de dados pessoais, conforme a LGPD, incluem: (a) execução de contrato; (b) cumprimento de obrigação legal; (c) consentimento do titular; (d) legítimo interesse; (e) exercício regular de direitos; (f) proteção ao crédito.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Compartilhamento */}
            <TabsContent value="compartilhamento">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Users} title="3. Compartilhamento de Dados" />
                  <Clause number="3.1">
                    Seus dados podem ser compartilhados com:
                  </Clause>
                  <BulletList items={[
                    { bold: "Produtores de eventos:", text: "apenas os dados estritamente necessários para a gestão do evento (nome do participante, e-mail, dados de check-in)." },
                    { bold: "Processadores de pagamento:", text: "parceiros homologados que processam transações de PIX, cartão de crédito e boleto, em conformidade com os padrões PCI-DSS." },
                    { bold: "Prestadores de serviço:", text: "empresas que auxiliam na operação da plataforma, como envio de e-mails, análise de dados e suporte técnico, sempre sob obrigações contratuais de confidencialidade." },
                    { bold: "Autoridades competentes:", text: "quando exigido por lei, ordem judicial ou requisição de autoridade policial ou administrativa." },
                  ]} />
                  <Clause number="3.2">
                    A TicketHall não vende dados pessoais a terceiros para fins de marketing. Qualquer compartilhamento será realizado dentro dos limites previstos na LGPD e exclusivamente para as finalidades descritas nesta Política.
                  </Clause>
                  <Clause number="3.3">
                    O Produtor de eventos é considerado controlador dos dados pessoais dos participantes de seus eventos, sendo responsável pelo tratamento realizado em seu âmbito e pelo cumprimento das obrigações legais correspondentes.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. Armazenamento */}
            <TabsContent value="armazenamento">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Lock} title="4. Armazenamento e Segurança" />
                  <Clause number="4.1">
                    Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Implementamos medidas técnicas e organizacionais robustas para proteger seus dados contra acesso não autorizado, perda, alteração ou destruição.
                  </Clause>
                  <Clause number="4.2">
                    As medidas de segurança incluem, mas não se limitam a: criptografia de dados sensíveis, firewalls, controles de acesso baseados em função, monitoramento contínuo de ameaças, testes de segurança periódicos e políticas internas de proteção de dados.
                  </Clause>
                  <Clause number="4.3">
                    Embora a TicketHall adote as melhores práticas de segurança da informação, não é possível garantir completamente a não ocorrência de interceptações e violações, uma vez que a internet possui sua estrutura de segurança em permanente aperfeiçoamento.
                  </Clause>
                  <Clause number="4.4">
                    Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a TicketHall comunicará os afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos e condições previstos na legislação.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. Direitos LGPD */}
            <TabsContent value="direitos">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Scale} title="5. Seus Direitos (LGPD)" />
                  <Clause number="5.1">
                    Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos em relação aos seus dados pessoais:
                  </Clause>
                  <BulletList items={[
                    { text: "Confirmar a existência de tratamento de dados pessoais." },
                    { text: "Acessar seus dados pessoais armazenados." },
                    { text: "Corrigir dados incompletos, inexatos ou desatualizados." },
                    { text: "Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade." },
                    { text: "Solicitar a portabilidade dos dados a outro fornecedor de serviço, quando aplicável." },
                    { text: "Obter informação sobre entidades públicas e privadas com as quais compartilhamos seus dados." },
                    { text: "Revogar consentimento a qualquer momento, quando o tratamento for baseado em consentimento." },
                    { text: "Peticionar em relação aos seus dados junto à ANPD (Autoridade Nacional de Proteção de Dados)." },
                  ]} />
                  <Clause number="5.2">
                    Para exercer seus direitos, acesse a seção "Privacidade" em sua conta na plataforma ou envie um e-mail para{" "}
                    <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>. 
                    Responderemos sua solicitação em até 15 (quinze) dias úteis, conforme previsto na legislação.
                  </Clause>
                  <Clause number="5.3">
                    A exclusão de dados poderá ser limitada quando o armazenamento for necessário para cumprimento de obrigação legal, execução de contrato ou exercício regular de direitos em processos judiciais ou administrativos.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. Cookies */}
            <TabsContent value="cookies">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Cookie} title="6. Cookies e Tecnologias de Rastreamento" />
                  <Clause number="6.1">
                    A TicketHall utiliza cookies e tecnologias similares (pixel tags, armazenamento local, identificadores de dispositivo) para diversas funções, incluindo autenticação, personalização da experiência e análise de desempenho.
                  </Clause>
                  <Clause number="6.2">
                    Utilizamos as seguintes categorias de cookies:
                  </Clause>
                  <BulletList items={[
                    { bold: "Cookies estritamente necessários:", text: "essenciais para o funcionamento da plataforma, como autenticação do usuário e segurança." },
                    { bold: "Cookies de desempenho:", text: "coletam informações sobre como os usuários utilizam a plataforma, ajudando a identificar erros e melhorar a experiência." },
                    { bold: "Cookies de funcionalidade:", text: "permitem personalização e lembrança de preferências do usuário." },
                    { bold: "Cookies de publicidade:", text: "utilizados para exibir anúncios relevantes com base nos hábitos de navegação." },
                  ]} />
                  <Clause number="6.3">
                    Você pode gerenciar suas preferências de cookies nas configurações do seu navegador. No entanto, a desativação de determinados cookies pode comprometer funcionalidades da plataforma.
                  </Clause>
                  <Clause number="6.4">
                    Provedores de serviços terceiros utilizados pela TicketHall poderão também utilizar cookies próprios. A TicketHall não possui controle sobre esses cookies de terceiros.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 7. Retenção */}
            <TabsContent value="retencao">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Clock} title="7. Retenção de Dados" />
                  <Clause number="7.1">
                    Mantemos seus dados pelo período necessário para cumprir as finalidades descritas nesta Política ou conforme exigido por lei. Os prazos de retenção consideram:
                  </Clause>
                  <BulletList items={[
                    { bold: "Dados de transações financeiras:", text: "mantidos por no mínimo 5 (cinco) anos para fins fiscais e regulatórios." },
                    { bold: "Dados de cadastro:", text: "mantidos enquanto a conta do usuário estiver ativa. Após inatividade prolongada, o usuário será notificado antes da exclusão." },
                    { bold: "Dados de navegação e cookies:", text: "mantidos pelo período necessário conforme a finalidade, geralmente até 12 meses." },
                    { bold: "Registros de acesso:", text: "mantidos por 6 (seis) meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014)." },
                  ]} />
                  <Clause number="7.2">
                    Após o término do período de retenção, os dados serão excluídos ou anonimizados, salvo quando houver necessidade legal ou regulatória para sua manutenção.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 8. Transferência Internacional */}
            <TabsContent value="internacional">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Globe} title="8. Transferência Internacional de Dados" />
                  <Clause number="8.1">
                    Seus dados poderão ser armazenados em servidores localizados fora do Brasil, em países que ofereçam nível adequado de proteção de dados pessoais ou mediante adoção de garantias apropriadas, conforme previsto na LGPD.
                  </Clause>
                  <Clause number="8.2">
                    A TicketHall utiliza serviços de nuvem de provedores reconhecidos internacionalmente, que adotam padrões de segurança e privacidade compatíveis com a legislação brasileira e regulamentações internacionais.
                  </Clause>
                  <Clause number="8.3">
                    Em todos os casos de transferência internacional, exigimos o cumprimento das mesmas garantias de segurança e privacidade que seguimos internamente.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 9. Contato */}
            <TabsContent value="contato">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <SectionHeader icon={Mail} title="9. Contato e Encarregado de Dados (DPO)" />
                  <Clause number="9.1">
                    Para dúvidas sobre esta Política ou sobre o tratamento de seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail{" "}
                    <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>.
                  </Clause>
                  <Clause number="9.2">
                    A comunicação entre a TicketHall e o usuário sobre assuntos de privacidade deverá ser realizada pelos canais oficiais de atendimento disponibilizados na plataforma.
                  </Clause>
                  <Clause number="9.3">
                    Podemos atualizar esta Política periodicamente para refletir mudanças em nossas práticas ou em requisitos legais. Notificaremos sobre mudanças significativas por e-mail ou notificação na plataforma. Recomendamos revisá-la regularmente.
                  </Clause>
                  <Clause number="9.4">
                    A eventual tolerância quanto a qualquer violação desta Política será considerada mera liberalidade. Caso alguma disposição for julgada inaplicável, as demais continuam em vigor.
                  </Clause>
                  <Clause number="9.5">
                    Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias relativas a esta Política, com renúncia expressa a qualquer outro.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
