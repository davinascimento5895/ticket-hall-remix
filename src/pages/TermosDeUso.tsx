import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ScrollText, UserCheck, ShoppingCart, Shield, Tag,
  Wallet, Ticket, RotateCcw, Copyright, Lock, AlertTriangle, FileText,
  BookOpen
} from "lucide-react";
import { useState } from "react";

const sections = [
  { id: "geral", label: "Informações Gerais", icon: BookOpen },
  { id: "cadastro", label: "Cadastro e Conta", icon: UserCheck },
  { id: "vendas", label: "Vendas e Pagamentos", icon: ShoppingCart },
  { id: "fraude", label: "Prevenção a Fraudes", icon: Shield },
  { id: "meia", label: "Meia-Entrada", icon: Tag },
  { id: "taxas", label: "Taxas e Repasse", icon: Wallet },
  { id: "ingressos", label: "Ingressos e Check-in", icon: Ticket },
  { id: "cancelamento", label: "Cancelamento e Reembolso", icon: RotateCcw },
  { id: "propriedade", label: "Propriedade Intelectual", icon: Copyright },
  { id: "seguranca", label: "Segurança da Plataforma", icon: Lock },
  { id: "responsabilidade", label: "Limitação de Responsabilidade", icon: AlertTriangle },
  { id: "disposicoes", label: "Disposições Gerais", icon: FileText },
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

export default function TermosDeUso() {
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Termos de Uso — TicketHall"
        description="Leia os Termos de Uso da plataforma TicketHall. Saiba seus direitos e deveres ao utilizar nossos serviços de venda de ingressos online."
      />
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">Termos de Uso</h1>
            </div>
            <p className="text-muted-foreground">
              Última atualização: 1 de março de 2026
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Bem-vindo à TicketHall! Estes Termos de Uso regulam o relacionamento entre a plataforma e seus usuários. 
              Ao utilizar nossos serviços, você concorda integralmente com as disposições aqui descritas.
            </p>
          </div>

          {/* Glossary Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="glossario" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Glossário de Termos
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                      {[
                        { term: "Plataforma", def: "Plataforma tecnológica TicketHall, acessível pelo site ou aplicativos oficiais, que intermedia a venda de ingressos e gestão de eventos." },
                        { term: "Produtor", def: "Pessoa física ou jurídica que cria, gerencia e divulga eventos por meio da TicketHall." },
                        { term: "Comprador", def: "Titular da compra que adquire ingressos pagos ou gratuitos para si ou para terceiros através de sua conta." },
                        { term: "Participante", def: "Titular do ingresso que usufruirá do acesso ao evento. Pode coincidir com o Comprador." },
                        { term: "Usuário", def: "Designação geral para Produtores, Compradores, Participantes e visitantes da plataforma." },
                        { term: "Chargeback", def: "Cancelamento de compra online via cartão, por não reconhecimento do titular ou descumprimento de regulamentações das administradoras." },
                        { term: "Código de Acesso", def: "QR Code gerado para validação e acesso do participante ao evento." },
                        { term: "Taxa de Serviço", def: "Percentual cobrado pela TicketHall sobre o valor dos ingressos vendidos, atualmente de 7%." },
                      ].map(({ term, def }) => (
                        <div key={term} className="space-y-1">
                          <span className="text-sm font-semibold text-foreground">{term}</span>
                          <p className="text-xs text-muted-foreground leading-relaxed">{def}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

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

            {/* 1. Informações Gerais */}
            <TabsContent value="geral">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={BookOpen} title="1. Informações Gerais" />
                  <Clause number="1.1">
                    A TicketHall é uma empresa de tecnologia especializada em intermediar a relação entre produtores de eventos e compradores de ingressos. Nossos serviços incluem: (i) disponibilizar soluções tecnológicas para o Produtor criar, organizar, gerir e divulgar eventos; (ii) viabilizar as operações de venda de ingressos e produtos relacionados aos eventos; (iii) intermediar a distribuição de ingressos cadastrados pelos Produtores.
                  </Clause>
                  <Clause number="1.2">
                    A TicketHall prestará seus serviços por meio de plataforma própria, que poderá contemplar sistemas, portais, aplicativos e demais recursos definidos para prestação dos serviços e intermediação das vendas.
                  </Clause>
                  <Clause number="1.3">
                    Todos os Usuários declaram ter ciência e concordam com estes Termos de Uso, a Política de Privacidade e demais políticas da TicketHall, que constituem parte integrante e indissociável deste documento.
                  </Clause>
                  <Clause number="1.4">
                    A Plataforma é apresentada aos Usuários da maneira como está disponível, podendo passar por constantes aprimoramentos e atualizações. A TicketHall se obriga a preservar as funcionalidades com links não-quebrados, layouts que privilegiem a usabilidade e exibir as funcionalidades de maneira clara e completa.
                  </Clause>
                  <Clause number="1.5">
                    A TicketHall envida esforços para manter a disponibilidade contínua da plataforma. No entanto, poderá ocorrer indisponibilidade temporária decorrente de manutenção necessária ou motivo de força maior. Nesses casos, faremos o possível para restabelecer o acesso no menor prazo possível.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. Cadastro e Conta */}
            <TabsContent value="cadastro">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={UserCheck} title="2. Cadastro e Conta" />
                  <Clause number="2.1">
                    O cadastro na TicketHall é gratuito. No entanto, a utilização de determinados serviços ou funcionalidades poderá envolver cobranças específicas, conforme estabelecido nestes Termos.
                  </Clause>
                  <Clause number="2.2">
                    O Usuário é integralmente responsável por fornecer informações exatas, verdadeiras e atualizadas, incluindo dados pessoais como nome completo, CPF, e-mail e telefone. A criação de perfis falsos pode ser considerada crime de falsa identidade, falsidade ideológica ou estelionato.
                  </Clause>
                  <Clause number="2.3">
                    Ao se cadastrar, o Usuário declara que cumpre os requisitos legais de idade (maiores de 18 anos), ou que está legalmente assistido e autorizado por seus responsáveis legais. Nossos serviços também são acessíveis para menores acima de 13 anos, desde que devidamente autorizados.
                  </Clause>
                  <Clause number="2.4">
                    Caso sejam identificadas atividades suspeitas, inconsistências cadastrais ou transações com risco de fraude, a TicketHall poderá, a qualquer tempo, confirmar a identidade do Usuário, solicitando documentos de identificação ou outras formas de comprovação.
                  </Clause>
                  <Clause number="2.5">
                    Os Usuários acessarão sua conta através de login e senha pessoais e intransferíveis, ou por meio de provedores de autenticação terceiros (como Google). O Usuário se compromete a não compartilhar suas credenciais e a notificar a TicketHall imediatamente sobre qualquer uso não autorizado de sua conta.
                  </Clause>
                  <Clause number="2.6">
                    Sem prejuízo de outras medidas, a TicketHall poderá advertir, suspender ou cancelar o cadastro de Usuários que: (a) descumpram disposições destes Termos; (b) pratiquem atos fraudulentos; (c) pratiquem atos suspeitos de cambismo; (d) causem dano ou prejuízo a terceiros ou à própria TicketHall.
                  </Clause>
                  <Clause number="2.7">
                    Apenas o titular da conta poderá ter acesso aos dados relativos à mesma. Eventuais alterações em dados cadastrados somente poderão ser feitas pelo próprio Usuário, devidamente autenticado.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Vendas e Pagamentos */}
            <TabsContent value="vendas">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={ShoppingCart} title="3. Vendas e Pagamentos" />
                  <Clause number="3.1">
                    O processamento dos pagamentos inicia-se na página do Evento publicado pelo Produtor. O Comprador selecionará os ingressos desejados, escolherá o método de pagamento entre as opções disponíveis (PIX, cartão de crédito e boleto bancário) e finalizará o pedido.
                  </Clause>
                  <Clause number="3.2">
                    Após a confirmação de aprovação do pagamento, a TicketHall recolherá o valor correspondente, deduzirá as taxas devidas e repassará ao Produtor o valor restante, de acordo com o modelo de recebimento aplicável.
                  </Clause>
                  <Clause number="3.3">
                    Todas as transações realizadas por meio da Plataforma passam por processos internos de análise de risco. Caso a TicketHall identifique inconsistências, suspeita de fraude ou erro técnico, a compra poderá ser recusada, suspensa ou submetida a nova análise. Enquanto o pagamento não for aprovado, nenhum ingresso será garantido ao Comprador.
                  </Clause>
                  <Clause number="3.4">
                    O Produtor deverá utilizar somente os meios de pagamento disponíveis na Plataforma. Caso o Produtor indique outros meios de pagamento externos ou crie "ingressos grátis" com posterior cobrança, a TicketHall poderá excluir o evento ou moderar seu conteúdo.
                  </Clause>
                  <Clause number="3.5">
                    Para compras com cartão de crédito, o Comprador poderá optar por parcelamento, conforme as opções disponíveis no checkout. Eventuais taxas de parcelamento serão claramente exibidas antes da finalização da compra.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. Prevenção a Fraudes */}
            <TabsContent value="fraude">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Shield} title="4. Prevenção a Fraudes e Cambismo" />
                  <Clause number="4.1">
                    As transações realizadas na Plataforma podem passar por análise de risco e antifraude, utilizando padrões históricos, conferência de dados cadastrais e bases externas. Uma vez calculada a probabilidade de fraude, a compra poderá ser aprovada ou não, segundo critérios pré-estabelecidos pela TicketHall e legislação vigente.
                  </Clause>
                  <Clause number="4.2">
                    Compras realizadas com cartão de crédito que necessitem de confirmação adicional poderão passar por análise aprofundada, cujo prazo é de até 72 horas após a realização da compra. A TicketHall poderá solicitar documentos pessoais, informações do cartão de crédito e outros dados para confirmar a identidade do Comprador.
                  </Clause>
                  <Clause number="4.3">
                    A TicketHall poderá suspender contas de Usuários que apresentem ações suspeitas de cambismo. Caso comprovado o ato após análise interna, os ingressos adquiridos pela conta poderão ser cancelados a qualquer momento.
                  </Clause>
                  <Clause number="4.4">
                    O Produtor declara estar ciente de que diferentes perfis de eventos podem gerar maior ou menor número de contestações de pagamento (chargebacks), sendo de sua responsabilidade adotar práticas de controle e fiscalização adequadas, inclusive verificação de autenticidade dos ingressos e identificação dos Compradores no acesso ao evento.
                  </Clause>
                  <Clause number="4.5">
                    O Produtor deve zelar pela não ocorrência de fraude nas compras e auxiliar a TicketHall, sempre que solicitado, na apuração de eventuais suspeitas de fraude na venda de ingressos.
                  </Clause>
                  <Clause number="4.6">
                    A TicketHall não solicitará documentos ou informações a não ser por seus meios oficiais de comunicação, sendo eles endereços de e-mail sob o domínio "tickethall.com.br" ou canais verificados.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. Meia-Entrada */}
            <TabsContent value="meia">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Tag} title="5. Meia-Entrada" />
                  <Clause number="5.1">
                    Ao criarem eventos na Plataforma, os Produtores devem: (a) cumprir todas as disposições da Lei da Meia-Entrada (Lei Federal nº 12.933/2013), do Decreto nº 8.537/2015 e do Estatuto do Idoso (Lei nº 10.741/2003), bem como legislações estaduais e municipais aplicáveis; (b) informar claramente as condições e procedimentos para aquisição de ingressos de meia-entrada, incluindo documentos necessários para comprovação do direito ao benefício.
                  </Clause>
                  <Clause number="5.2">
                    É responsabilidade exclusiva do Produtor garantir que o evento esteja em conformidade com as legislações de meia-entrada, assegurando o benefício para estudantes, idosos, pessoas com deficiência e jovens de baixa renda, conforme legislação aplicável.
                  </Clause>
                  <Clause number="5.3">
                    Os Usuários reconhecem que a TicketHall não se responsabiliza pelo não cumprimento das leis de meia-entrada por parte do Produtor. A não observância dessas leis pode resultar em penalidades e ações judiciais ao Produtor.
                  </Clause>
                  <Clause number="5.4">
                    Em situações específicas, a venda de ingressos de meia-entrada poderá ser restrita à bilheteria do evento, mediante apresentação obrigatória de documento comprobatório.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. Taxas e Repasse */}
            <TabsContent value="taxas">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Wallet} title="6. Taxas e Repasse de Valores" />
                  <Clause number="6.1">
                    A TicketHall cobra uma Taxa de Serviço de 7% (sete por cento) sobre o valor de cada ingresso vendido. Esta taxa poderá ser absorvida pelo Produtor ou repassada ao Comprador, conforme configuração definida pelo Produtor na criação do evento.
                  </Clause>
                  <Clause number="6.2">
                    Poderá ser cobrada uma Taxa de Processamento para cobrir os custos associados ao processamento de pagamentos na Plataforma, calculada percentualmente sobre o valor total do pedido, conforme método de pagamento. O Comprador será informado do valor final antes de concluir a transação.
                  </Clause>
                  <Clause number="6.3">
                    A TicketHall compromete-se a emitir notas fiscais aos respectivos tomadores de serviços, observando a natureza do serviço prestado e a legislação aplicável. Cada parte será responsável pelo recolhimento dos tributos a que estiver sujeita.
                  </Clause>
                  <Clause number="6.4">
                    O Produtor receberá o valor das vendas realizadas por meio de repasse. O valor total, descontado da Taxa de Serviço e demais encargos aplicáveis, será repassado no 3º dia útil após o término do evento, por transferência bancária, para conta de titularidade do CPF/CNPJ do Produtor cadastrado na Plataforma.
                  </Clause>
                  <Clause number="6.5">
                    A TicketHall esclarece que o repasse considera a data em que o evento ocorrer de fato, e não a data cadastrada na Plataforma. O Produtor deverá cadastrar os dados bancários para repasse dos valores até a data de realização do evento.
                  </Clause>
                  <Clause number="6.6">
                    A TicketHall poderá, a qualquer tempo, reter ou compensar valores arrecadados para cumprimento de ordens judiciais, resolução de conflitos, reclamações ou situações que provoquem a necessidade de retenção. O Produtor concorda que os valores permanecerão bloqueados conforme determinação das autoridades competentes.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 7. Ingressos e Check-in */}
            <TabsContent value="ingressos">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Ticket} title="7. Entrega e Utilização de Ingressos" />
                  <Clause number="7.1">
                    Após a aprovação do pagamento, a confirmação da compra será enviada ao e-mail indicado pelo Comprador. Os ingressos estarão disponíveis na área "Meus Ingressos" da plataforma, que deverá ser utilizada para realizar o check-in e acesso ao evento.
                  </Clause>
                  <Clause number="7.2">
                    Os ingressos são associados a QR Codes que permitem a validação no momento do acesso ao evento. É responsabilidade do Comprador e/ou Participante manter os ingressos em segurança, garantindo o sigilo dos códigos e evitando divulgação pública.
                  </Clause>
                  <Clause number="7.3">
                    Os ingressos comprados por meio da Plataforma são nominais, cabendo ao Produtor decidir pela conferência dessa informação no momento de acesso ao evento. Os ingressos adquiridos podem ser usados para acesso ao evento uma única vez.
                  </Clause>
                  <Clause number="7.4">
                    A leitura e validação do QR Code dos ingressos (check-in) é de responsabilidade do Produtor. A TicketHall disponibiliza ferramentas de check-in, mas não se responsabiliza pela conferência presencial.
                  </Clause>
                  <Clause number="7.5">
                    A transferência de ingressos entre Usuários poderá ser permitida conforme as configurações definidas pelo Produtor para cada tipo de ingresso. A TicketHall não se responsabiliza por transferências realizadas fora da plataforma.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 8. Cancelamento e Reembolso */}
            <TabsContent value="cancelamento">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={RotateCcw} title="8. Cancelamento e Reembolso" />
                  <Clause number="8.1">
                    O Comprador poderá solicitar o cancelamento da compra em até 7 (sete) dias corridos a partir da data de compra, conforme previsto no Código de Defesa do Consumidor (Lei nº 8.078/90), desde que a solicitação seja feita antes da realização do evento.
                  </Clause>
                  <Clause number="8.2">
                    Para compras realizadas com cartão de crédito, o reembolso será processado em até 90 (noventa) dias, dependendo da data de fechamento da fatura do cartão. Para pagamentos via PIX, o reembolso será creditado na conta original em até 5 dias úteis.
                  </Clause>
                  <Clause number="8.3">
                    Caso o evento seja cancelado pelo Produtor, o reembolso integral será processado automaticamente no método de pagamento original em até 30 dias úteis. A responsabilidade pelo cancelamento do evento é exclusiva do Produtor organizador.
                  </Clause>
                  <Clause number="8.4">
                    A TicketHall poderá conduzir disputas, incluindo chargebacks, reclamações e estornos, e poderá iniciar cancelamentos sem a intervenção do Produtor nos casos de: (a) não cumprimento da política de reembolso ou do Código de Defesa do Consumidor; (b) detecção de indícios de fraude; (c) erro técnico no processamento; (d) número elevado de reclamações sobre determinado evento.
                  </Clause>
                  <Clause number="8.5">
                    O Produtor deverá, sempre que necessário, processar reembolsos exclusivamente por meio da Plataforma TicketHall, sendo vedada a realização de reembolsos por meios diversos.
                  </Clause>
                  <Clause number="8.6">
                    Caso o evento disponha da opção de Seguro de Ingresso (quando ativado pelo Produtor), condições especiais de reembolso poderão ser aplicadas conforme os termos específicos exibidos no momento da compra.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 9. Propriedade Intelectual */}
            <TabsContent value="propriedade">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Copyright} title="9. Direitos de Propriedade Intelectual" />
                  <Clause number="9.1">
                    O uso comercial da expressão "TicketHall", sua marca, logotipos, nome empresarial ou nome de domínio, bem como os conteúdos das telas, programas, bancos de dados, redes e arquivos, são de titularidade da TicketHall e estão protegidos pelas leis e tratados internacionais de direito autoral, marcas e patentes. A reprodução total ou parcial é proibida, salvo autorização prévia e expressa por escrito.
                  </Clause>
                  <Clause number="9.2">
                    A Plataforma pode manter links com outros sites, o que não significa que esses sites sejam de propriedade ou operados pela TicketHall. Não possuímos controle sobre sites de terceiros e não somos responsáveis por seus conteúdos, práticas e serviços.
                  </Clause>
                  <Clause number="9.3">
                    O Usuário assume total responsabilidade por todos os prejuízos, diretos e indiretos, que a TicketHall seja obrigada a incorrer em virtude de ato ou omissão do Usuário, incluindo violações de propriedade intelectual.
                  </Clause>
                  <Clause number="9.4">
                    Se a TicketHall receber reclamação ou questionamento de terceiros quanto a violação de propriedade intelectual, poderá remover ou suspender o conteúdo em questão e aplicar as sanções cabíveis.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 10. Segurança */}
            <TabsContent value="seguranca">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={Lock} title="10. Segurança da Plataforma" />
                  <Clause number="10.1">
                    Não é permitido o acesso às áreas de programação da Plataforma, seu banco de dados ou qualquer outro conjunto de informações que faça parte da atividade de desenvolvimento e manutenção da plataforma.
                  </Clause>
                  <Clause number="10.2">
                    Os Usuários não estão autorizados a realizar ou permitir engenharia reversa, decompilar, copiar, modificar, reproduzir, alugar, sublicenciar, publicar, divulgar, transmitir, emprestar, distribuir ou, de outra maneira, dispor das ferramentas da Plataforma e de suas funcionalidades.
                  </Clause>
                  <Clause number="10.3">
                    É proibida a utilização de aplicativos spider, crawlers, mineração de dados ou qualquer ferramenta automatizada para realizar operações massificadas ou extrair informações da plataforma.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 11. Limitação de Responsabilidade */}
            <TabsContent value="responsabilidade">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={AlertTriangle} title="11. Limitação de Responsabilidade" />
                  <Clause number="11.1">
                    A TicketHall atua como intermediária tecnológica entre Produtores e Compradores. Não nos responsabilizamos pela realização, qualidade, segurança ou qualquer outro aspecto dos eventos. A responsabilidade pelo evento é exclusiva do Produtor organizador.
                  </Clause>
                  <Clause number="11.2">
                    A TicketHall não tem obrigação de controlar todas as ações executadas pelos Usuários na Plataforma e não poderá ser responsabilizada por atos de seus Usuários, inclusive os de caráter ilícito, cabendo a estes responderem pessoal e exclusivamente por eventuais reclamações ou demandas judiciais.
                  </Clause>
                  <Clause number="11.3">
                    A TicketHall não se responsabiliza por danos ocasionados por eventos de terceiros, como ataques cibernéticos, falhas no sistema, no servidor ou na conexão à internet, inclusive por ações de programas maliciosos, salvo se tal fato decorrer de dolo ou culpa comprovada da TicketHall.
                  </Clause>
                  <Clause number="11.4">
                    O Produtor isenta a TicketHall de qualquer dano nos casos de paralisações ou indisponibilidade, parciais ou totais, decorrentes de falta temporária de energia, falhas em serviços de telecomunicações, greves, pandemias ou quaisquer fatos que não estejam diretamente ligados ao serviço.
                  </Clause>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 12. Disposições Gerais */}
            <TabsContent value="disposicoes">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <SectionHeader icon={FileText} title="12. Disposições Gerais" />
                  <Clause number="12.1">
                    Ao navegar pela Plataforma e utilizar suas funcionalidades, os Usuários aceitam todo o disposto nestes Termos de Uso e demais políticas vigentes na data de acesso.
                  </Clause>
                  <Clause number="12.2">
                    Os presentes Termos de Uso estão sujeitos a constante melhoria e aprimoramento. A TicketHall reserva-se o direito de modificá-los a qualquer momento, comunicando alterações significativas por e-mail ou notificação na Plataforma com antecedência mínima de 15 dias.
                  </Clause>
                  <Clause number="12.3">
                    A eventual tolerância quanto a qualquer violação destes Termos será considerada mera liberalidade e não será interpretada como novação, renúncia a direitos ou alteração contratual.
                  </Clause>
                  <Clause number="12.4">
                    Caso alguma disposição destes Termos for julgada inaplicável ou sem efeito, as demais normas continuam a viger. Os Termos aqui descritos serão interpretados segundo a legislação brasileira.
                  </Clause>
                  <Clause number="12.5">
                    A TicketHall somente será obrigada a disponibilizar registros de acesso, informações pessoais ou comunicações privadas armazenadas em sua plataforma mediante ordem judicial ou requisição de autoridade competente.
                  </Clause>
                  <Clause number="12.6">
                    Sempre que possível, potenciais divergências serão resolvidas de forma amigável. Quando esgotados todos os esforços, fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                  </Clause>
                  <Clause number="12.7">
                    Para dúvidas sobre estes Termos, entre em contato pelo e-mail{" "}
                    <a href="mailto:contato@tickethall.com.br" className="text-primary hover:underline">contato@tickethall.com.br</a>.
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
