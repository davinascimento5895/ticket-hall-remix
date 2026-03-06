import { SEOHead } from "@/components/SEOHead";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "geral", label: "Informações Gerais" },
  { id: "glossario", label: "Glossário" },
  { id: "cadastro", label: "Cadastro e Acesso" },
  { id: "vendas", label: "Vendas e Pagamentos" },
  { id: "fraude", label: "Prevenção a Fraudes" },
  { id: "meia", label: "Meia-Entrada" },
  { id: "taxas", label: "Taxas e Nota Fiscal" },
  { id: "repasse", label: "Repasse de Valores" },
  { id: "ingressos", label: "Entrega e Utilização de Ingressos" },
  { id: "cancelamento", label: "Cancelamento e Reembolso" },
  { id: "transferencia", label: "Transferência de Ingressos" },
  { id: "responsabilidades", label: "Responsabilidades" },
  { id: "propriedade", label: "Propriedade Intelectual" },
  { id: "seguranca", label: "Segurança da Plataforma" },
  { id: "disposicoes", label: "Disposições Gerais" },
];

export default function TermosDeUso() {
  const [activeSection, setActiveSection] = useState("geral");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const sorted = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveSection(sorted[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <SEOHead
        title="Termos de Uso — TicketHall"
        description="Leia os Termos de Uso da plataforma TicketHall. Saiba seus direitos e deveres ao utilizar nossos serviços de venda de ingressos online."
      />

      <main className="pt-28 pb-20">
        <div className="container max-w-7xl">
          {/* Header */}
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Documento Legal
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Os Termos de Uso a seguir são baseados nos princípios e valores da TicketHall e têm o objetivo de reger o relacionamento entre a plataforma e seus Usuários. Como condição para acesso e utilização da plataforma TicketHall e suas funcionalidades, o Usuário declara que realizou a leitura completa e atenta das regras deste documento, estando plenamente ciente e de acordo com elas em sua versão mais atual.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Última atualização: 1 de março de 2026
            </p>
          </div>

          <Separator className="mb-10" />

          {/* Content Layout */}
          <div className="flex gap-12">
            {/* Sidebar Navigation - Desktop */}
            <nav className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Sumário
                </p>
                <ul className="space-y-1">
                  {sections.map(({ id, label }) => (
                    <li key={id}>
                      <button
                        onClick={() => scrollToSection(id)}
                        className={cn(
                          "w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors",
                          activeSection === id
                            ? "text-primary font-medium bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              <article className="space-y-16">

                {/* 1. Informações Gerais */}
                <section id="geral">
                  <h2 className="text-xl font-semibold text-foreground mb-4">1. Informações Gerais</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.1. A TicketHall é uma empresa de tecnologia especializada em integrar, intermediar e orquestrar a relação entre diferentes partes do mercado de eventos e serviços relacionados. Os presentes Termos de Uso estabelecem as condições nas quais se dão a prestação dos serviços ofertados, tais como:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">(i) disponibilizar soluções tecnológicas para o Produtor criar, organizar, gerir e divulgar Eventos;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">(ii) viabilizar, por meio da Plataforma, as operações de reserva e venda de ingressos, serviços e produtos para eventos, que são integralmente cadastrados, publicados e organizados pelo Produtor;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">(iii) intermediar a venda e a distribuição de ingressos, serviços e produtos para os Eventos cadastrados pelo Produtor.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.2. A TicketHall realizará a prestação dos serviços por meio da disponibilização de uma solução de propriedade da TicketHall ("Plataforma"). A Plataforma poderá contemplar uma variedade de sistemas, portais, softwares, soluções, ferramentas, páginas, aplicativos e demais recursos definidos pela TicketHall para prestação dos serviços e intermediação das vendas.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.3. Todos os Usuários (Produtores, Compradores e Participantes) declaram ter ciência e concordam com os presentes Termos de Uso, a Política de Privacidade e demais políticas da TicketHall, que constituem parte integrante e indissociável deste documento. O presente Termo de Uso, juntamente com as demais políticas, constitui o acordo integral celebrado entre as partes.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.4. A Plataforma é apresentada aos Usuários da maneira como está disponível, podendo passar por constantes aprimoramentos e atualizações, sendo que a TicketHall se obriga a: (a) preservar as funcionalidades da Plataforma, com links não-quebrados, utilizando layouts que privilegiem a usabilidade e navegabilidade; (b) exibir as funcionalidades de maneira clara, completa, precisa e suficiente, de modo que possibilite a exata percepção das operações realizadas.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    1.5. A TicketHall envida esforços para manter a disponibilidade contínua e permanente de sua Plataforma. No entanto, poderá ocorrer, eventualmente, alguma indisponibilidade temporária decorrente de manutenção necessária ou mesmo gerada por motivo de força maior, como desastres naturais, falhas ou colapsos nos sistemas centrais de comunicação e acesso à internet ou fatos de terceiro que fogem de sua esfera de vigilância e responsabilidade. Em caso de indisponibilidade, a TicketHall fará tudo que estiver ao seu alcance para restabelecer o acesso no menor prazo possível, dentro das limitações técnicas de seus serviços próprios e de terceiros.
                  </p>
                </section>

                {/* 2. Glossário */}
                <section id="glossario">
                  <h2 className="text-xl font-semibold text-foreground mb-4">2. Glossário</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Para os fins destes Termos de Uso, consideram-se as seguintes definições:
                  </p>
                  <div className="space-y-3">
                    {[
                      { term: "Chargeback", def: "cancelamento de uma compra online realizada através de cartão de débito ou crédito, que pode acontecer em virtude do não reconhecimento da compra pelo titular do cartão ou pelo fato de a transação não obedecer às regulamentações previstas nos contratos, termos, aditivos e manuais editados pelas administradoras de cartão." },
                      { term: "Código de Acesso", def: "termo utilizado para designar o QR Code gerado para acesso aos eventos na plataforma TicketHall." },
                      { term: "Comprador", def: "titular da compra, aquele que adquire ingressos pagos ou gratuitos para si ou para outrem através de sua conta na TicketHall. O pedido ficará registrado na conta do Comprador." },
                      { term: "Contestação", def: "reclamação de cobrança indevida, solicitada pelo titular do cartão de crédito junto à operadora de seu cartão, podendo ser iniciada por diversas razões, tais como o esquecimento de que a compra foi realizada, a utilização do cartão por outros membros da família, ou resultado de uma compra fraudulenta realizada por terceiros." },
                      { term: "Estorno", def: "ação de estornar crédito ou débito indevidamente lançado." },
                      { term: "Participante", def: "titular do ingresso, aquele que usufruirá do ingresso adquirido pelo Comprador. Caso o Comprador adquira ingresso para uso próprio, será também Participante. Caso adquira ingressos cuja titularidade será de terceiros, estes serão considerados somente Participantes e não Compradores." },
                      { term: "Plataforma TicketHall", def: "plataforma tecnológica que intermedia a venda de ingressos, inscrições e serviços relacionados aos eventos cadastrados pelos Produtores, acessível pelo site ou por meio de aplicativos oficiais." },
                      { term: "Produtor", def: "pessoa física ou jurídica que cria, gerencia e divulga seus eventos por meio da plataforma TicketHall." },
                      { term: "Taxa de Serviço", def: "percentual cobrado pela TicketHall sobre o valor dos ingressos vendidos, atualmente de 7% (sete por cento), podendo ser absorvida pelo Produtor ou repassada ao Comprador." },
                      { term: "Usuário", def: "termo utilizado para designar, quando referidos em conjunto, Produtores, Compradores, Participantes e pessoas que navegam na plataforma TicketHall." },
                    ].map(({ term, def }) => (
                      <div key={term} className="border-l-2 border-border pl-4">
                        <p className="text-sm">
                          <strong className="text-foreground">{term}:</strong>{" "}
                          <span className="text-muted-foreground">{def}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Cadastro e Acesso */}
                <section id="cadastro">
                  <h2 className="text-xl font-semibold text-foreground mb-4">3. Cadastro e Acesso</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.1. O cadastro na plataforma TicketHall é gratuito. No entanto, a utilização de determinados serviços, funcionalidades ou modelos de operação poderá envolver cobranças específicas, conforme estabelecido nestes Termos de Uso.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.2. A depender do Evento, o cadastro na plataforma TicketHall é requisito para que os Compradores e Participantes acessem os seus ingressos. Os ingressos são disponibilizados para utilização pessoal, podendo ser acessados por meio do site e/ou aplicativo da TicketHall, conforme aplicável.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.3. O Usuário é integralmente responsável por fornecer informações exatas, verdadeiras e atualizadas, incluindo, mas não se limitando, aos dados pessoais.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.3.1. A TicketHall não se responsabiliza pela veracidade ou assertividade dos dados inseridos no cadastro. A criação de perfis falsos na plataforma pode ser considerada como crime de falsa identidade, falsidade ideológica ou estelionato. Além disso, o fornecimento de informações falsas, incorretas ou imprecisas, bem como a criação de perfis falsos, constitui quebra grave destes Termos de Uso e poderá resultar na não prestação dos serviços aqui descritos, sem qualquer ônus para a TicketHall.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.3.2. Ao se cadastrar e utilizar a Plataforma, o Usuário declara que cumpre os requisitos de idade estabelecidos (maiores de 18 anos), ou que está legalmente assistido e autorizado por seus responsáveis legais, em total conformidade com as leis vigentes aplicáveis, comprometendo-se a atualizar seus dados pessoais sempre que necessário ou quando solicitado. Caso o Usuário não cumpra os requisitos de idade ou existam indícios de que as informações fornecidas não são verdadeiras, a TicketHall reserva-se o direito de suspender ou encerrar a conta do Usuário imediatamente, além de recusar a prestação de quaisquer serviços.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.4. Caso sejam identificadas atividades suspeitas, inconsistências cadastrais ou transação que apresente considerável risco de fraude, a TicketHall poderá, a qualquer tempo e a seu exclusivo critério, confirmar a identidade e os dados pessoais do Usuário, podendo solicitar documentos de identificação, realizar verificações por meio de ferramentas que utilizem dados biométricos ou outras formas de comprovação, inclusive para fins de verificação de idade. Essa solicitação poderá se dar por telefone, e-mail ou outro meio hábil.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.4.1. Qualquer erro ou atraso no processo de envio ou confirmação da identidade do Usuário que gere prejuízo ou dano de qualquer natureza será de responsabilidade exclusiva do Usuário.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.5. Sem prejuízo de outras medidas, a TicketHall poderá advertir, suspender ou cancelar o cadastro dos Usuários, bem como os eventos associados, negando-se a prestar os serviços descritos nestes Termos, caso o Usuário:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">a) Descumpra qualquer disposição destes Termos ou qualquer outra política da TicketHall;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">b) Pratique atos fraudulentos, dolosos ou culposos (tais como negligência ou imprudência) que causem danos à Plataforma ou a terceiros;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">c) Pratique atos suspeitos de cambismo, tais como fornecer, desviar ou facilitar a distribuição de ingressos para a venda por preço igual ou superior ao originalmente designado, sem autorização;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">d) Dê causa a qualquer tipo de dano ou prejuízo a terceiro ou à própria TicketHall, na utilização da Plataforma.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.6. Ao se cadastrar, os Usuários declaram e concordam que: (a) as informações fornecidas são verdadeiras e precisas, devendo atualizá-las sempre que necessário ou solicitado; (b) têm o compromisso de informar, no prazo de 10 (dez) dias, quaisquer alterações em seus dados cadastrais, inclusive eventual revogação de poderes, no caso de pessoas jurídicas; (c) reconhecem que a TicketHall poderá manter programa de prevenção à lavagem de dinheiro e se comprometem a reportar imediatamente caso identifiquem alguma suspeita de crime ou atividade ilícita na Plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.7. Os Usuários acessarão sua conta através de login e senha pessoais e intransferíveis, ou por meio de contas pessoais providas por terceiros, como Google. Os Usuários se comprometem a não informar a terceiros tais dados, responsabilizando-se integralmente pelo uso que deles seja feito, se comprometendo a notificar a TicketHall, imediatamente, acerca de quaisquer usos não autorizados de sua conta ou quaisquer outras violações de segurança. A TicketHall não será responsável por quaisquer perdas e danos resultantes de acessos não autorizados ou uso da conta.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    3.8. Apenas o titular da conta na TicketHall poderá ter acesso aos dados relativos à mesma, tendo em vista seu caráter pessoal. Eventuais alterações em dados cadastrados somente poderão ser feitas pelo próprio Usuário, devidamente autenticado. Em regra, a TicketHall não realiza este tipo de alteração, independentemente da razão alegada ou circunstância.
                  </p>
                </section>

                {/* 4. Vendas */}
                <section id="vendas">
                  <h2 className="text-xl font-semibold text-foreground mb-4">4. Vendas e Pagamentos</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.1. O processamento dos pagamentos das vendas inicia-se, geralmente, na página do Evento publicado pelo Produtor. O Comprador selecionará os itens que deseja colocar em seu carrinho, bem como o método de pagamento, considerando as opções disponíveis na Plataforma (PIX, cartão de crédito, boleto bancário), e em seguida, poderá finalizar o pedido.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.1.1. Após a confirmação de aprovação do pagamento, que poderá ser feita por intermediário financeiro, a TicketHall recolherá o valor correspondente, deduzirá as taxas devidas e repassará ao Produtor o valor restante, de acordo com o modelo de recebimento aplicável.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.2. Todas as transações realizadas por meio da Plataforma passam por processos internos de análise de risco que poderão ser complementados por verificação dos processadores de pagamentos. Caso a TicketHall identifique alguma inconsistência, suspeita de fraude ou erro técnico no procedimento de pagamento, a compra poderá ser imediatamente recusada, suspensa ou submetida a um novo processo de análise. Enquanto o pagamento não for aprovado e confirmado, o pedido será considerado pendente e nenhum ingresso ou produto será garantido ao Comprador. Em caso de não aprovação ou cancelamento automático do pagamento, o pedido será anulado e o Comprador será notificado por e-mail no endereço associado à compra.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.3. O Produtor deverá utilizar somente os meios de pagamento disponíveis na Plataforma para comercialização de ingressos pagos. Caso o Produtor indique outros meios de pagamento (ex.: transferência entre contas bancárias), ou crie "ingressos grátis" com posterior cobrança do Comprador, a TicketHall poderá excluir o Evento ou moderar seu conteúdo, a seu exclusivo critério, sem qualquer ônus.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    4.4. Nas compras realizadas com a opção de parcelamento, poderão incidir Taxas de Parcelamento, cujas opções estarão claramente expostas ao Comprador antes da finalização do pedido. O Comprador poderá optar por alterar a opção de parcelamento antes de confirmar o pedido.
                  </p>
                </section>

                {/* 5. Prevenção a Fraudes */}
                <section id="fraude">
                  <h2 className="text-xl font-semibold text-foreground mb-4">5. Prevenção a Fraudes e ao Cambismo</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.1. As transações realizadas na Plataforma podem passar por análise de risco e antifraude, visando garantir a segurança e a idoneidade das operações. Esse processo utiliza padrões históricos, conferência de dados cadastrais, bases externas e fornecedores ou parceiros. Uma vez calculada a probabilidade de que determinada transação seja fraudulenta, a compra poderá ser aprovada ou não, segundo critérios pré-estabelecidos pela TicketHall e/ou pela legislação vigente.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.2. Caso alguma transação seja identificada com considerável nível de risco, etapas adicionais de validação poderão acontecer durante a análise.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.2.1. Compras realizadas com cartão de crédito que necessitem de confirmação ou validação adicional poderão passar pelo processo de análise aprofundada. A aprovação poderá permanecer pendente até a conclusão dessa análise, cujo prazo é de 72 (setenta e duas) horas após a realização da compra.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.2.2. As transações com alta probabilidade de fraude podem passar por uma etapa de validação biométrica. A biometria do titular do cartão poderá ser solicitada, a fim de se verificar se é realmente o titular dos dados inseridos no pedido.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.2.3. A TicketHall poderá solicitar informações adicionais por meio de seus canais oficiais de comunicação, cabendo aos Compradores fornecerem essas informações em tempo hábil para a aprovação da compra, responsabilizando-se pelas consequências decorrentes de eventual atraso ou erro no envio das informações solicitadas. Poderão ser solicitados documentos pessoais, informações do cartão de crédito utilizado, entre outros dados.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.3. Caso os documentos não sejam enviados pelo Comprador no prazo determinado, ficará a cargo da TicketHall cancelar ou suspender a transação de acordo com os critérios reconhecidamente utilizados no mercado para análises de risco. O cancelamento da transação nessas circunstâncias não gera expectativa de direito ou qualquer tipo de indenização.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.4. A TicketHall não solicitará documentos ou informações a não ser por seus meios oficiais de comunicação, sendo eles endereços de e-mail sob o domínio "tickethall.com.br" ou canais verificados.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.5. As contestações das compras reportadas serão analisadas pela operadora de cartão de crédito, pelos processadores de pagamentos utilizados pela TicketHall, ou pela própria TicketHall. Para as contestações recebidas, a TicketHall poderá disputar a contestação junto à instituição financeira, apresentando os documentos e registros necessários para comprovar a legitimidade da transação.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.5.1. Ao realizar uma contestação, o Comprador poderá ficar impossibilitado de efetuar novas compras na Plataforma até que a análise da contestação seja concluída. Contestações indevidas podem ocasionar a suspensão de compras futuras.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.6. O Produtor declara estar ciente de que diferentes perfis de eventos podem gerar maior ou menor número de contestações de pagamento (chargebacks), sendo de sua exclusiva responsabilidade adotar práticas de controle e fiscalização adequadas no acesso ao evento, inclusive a verificação de autenticidade dos ingressos e identificação dos Compradores. O risco financeiro decorrente das contestações de pagamento é de responsabilidade do Produtor, podendo a TicketHall reter ou descontar dos repasses os valores relativos a contestações procedentes.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.7. A TicketHall poderá suspender contas de Usuários que apresentem ações suspeitas de cambismo. Caso comprovado o ato após análise interna, os ingressos adquiridos poderão ser cancelados a qualquer momento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.8. O Produtor deve zelar pela não ocorrência de fraude nas compras e auxiliar a TicketHall, sempre que solicitado, na apuração de eventual suspeita de fraude na venda de ingressos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    5.8.1. Caso a TicketHall identifique, a partir de sua análise de risco ou mediante denúncia fundamentada, indícios de que o Produtor possa estar, direta ou indiretamente, envolvido em fraudes relacionadas à venda de ingressos, poderão ser adotadas medidas preventivas, corretivas e legais, a exclusivo critério da TicketHall. Tais medidas incluem, mas não se limitam a: cancelamento dos ingressos, suspensão do evento da Plataforma, estorno dos valores aos Compradores, suspensão temporária de repasses e retenção preventiva de valores, exclusão da conta do Produtor e eventual responsabilização judicial, cível e/ou criminal.
                  </p>
                </section>

                {/* 6. Meia-Entrada */}
                <section id="meia">
                  <h2 className="text-xl font-semibold text-foreground mb-4">6. Meia-Entrada</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    6.1. Ao criarem eventos na plataforma TicketHall, os Produtores devem:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">a) Cumprir todas as disposições da Lei da Meia-Entrada (Lei Federal nº 12.933/2013), do Decreto nº 8.537/2015 e do Estatuto do Idoso (Lei nº 10.741/2003), assim como as legislações federais, estaduais e municipais aplicáveis;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">b) Comunicar e fornecer, com exatidão e transparência, a política de meia-entrada de seus Eventos, garantindo que todas as informações relevantes sejam disponibilizadas aos Compradores e Participantes;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">c) Assegurar que os eventos estejam em conformidade com as legislações vigentes, proporcionando o benefício de meia-entrada para estudantes, idosos, pessoas com deficiência e jovens de baixa renda;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">d) Informar claramente as condições e procedimentos para a aquisição de ingressos de meia-entrada, incluindo os documentos necessários para comprovação do direito ao benefício.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    6.2. Os Usuários reconhecem que a TicketHall não se responsabiliza pelo não cumprimento das leis de meia-entrada por parte do Produtor. Cabe exclusivamente ao Produtor garantir que todas as normas sejam observadas, isentando a TicketHall de quaisquer ônus, multas e responsabilidades pelo descumprimento, uma vez que a TicketHall disponibiliza apenas a plataforma para a comercialização de ingressos e gestão de Eventos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    6.3. Em algumas situações, a venda de ingressos de meia-entrada poderá ser restringida à bilheteria do Evento, mediante apresentação obrigatória de documento comprobatório pelo Comprador.
                  </p>
                </section>

                {/* 7. Taxas e Nota Fiscal */}
                <section id="taxas">
                  <h2 className="text-xl font-semibold text-foreground mb-4">7. Taxas e Nota Fiscal</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.1. Será cobrada uma Taxa de Serviço de 7% (sete por cento) sobre o valor de cada ingresso vendido por meio da Plataforma, calculada sobre as vendas online processadas. Esta taxa poderá ser absorvida pelo Produtor ou repassada ao Comprador, conforme configuração definida pelo Produtor na criação do evento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.2. Poderá ser cobrada uma Taxa de Processamento para cobrir os custos associados ao processamento dos pagamentos na Plataforma, calculada percentualmente sobre o valor total do pedido, conforme método de pagamento adotado. O Comprador será informado do valor final antes de concluir a transação.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.3. Nas compras realizadas com a opção de parcelamento, poderão incidir Taxas de Parcelamento, cujas opções estarão claramente expostas ao Comprador antes da finalização.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.4. A TicketHall compromete-se a emitir notas fiscais aos respectivos tomadores de serviços para cada linha de receita, observando a natureza do serviço prestado e a legislação aplicável. As notas fiscais poderão ser emitidas aos Produtores ou aos Compradores, dependendo do tipo de serviço fornecido.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    7.4.1. Cada parte será responsável pelo recolhimento dos tributos a que estiver sujeita, conforme sua atividade econômica e regime tributário. A TicketHall não se responsabiliza por obrigações fiscais atribuídas ao Produtor, inclusive aquelas decorrentes da emissão de notas fiscais ou do recebimento de valores por meio da Plataforma.
                  </p>
                </section>

                {/* 8. Repasse de Valores */}
                <section id="repasse">
                  <h2 className="text-xl font-semibold text-foreground mb-4">8. Repasse de Valores</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.1. O Produtor receberá o valor das vendas realizadas por meio de repasse. O valor total vendido, descontada a Taxa de Serviço e demais encargos aplicáveis, será repassado no 3º (terceiro) dia útil após o término real do evento, por transferência bancária, a uma conta de titularidade do CNPJ/CPF do Produtor, conforme cadastro indicado na Plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.1.1. A TicketHall esclarece que o repasse considera a data em que o evento ocorrer de fato, e não a data cadastrada na Plataforma. Caso a data indicada para o evento não corresponda à data real, o repasse poderá ser postergado até o 3º dia útil após a data em que o evento for efetivamente finalizado.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.1.2. Ao cadastrar a conta bancária para repasse, o Produtor deverá indicar como "Favorecido" o mesmo titular do cadastro de usuário na Plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.2. Os repasses serão efetuados dentro dos prazos indicados, contados em dias úteis bancários. Caso a data prevista recaia em feriado, o pagamento será automaticamente postergado para o próximo dia útil subsequente. Eventuais atrasos decorrentes de instabilidades do sistema bancário, feriados bancários ou fatos de força maior não serão imputados à TicketHall.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.3. Os valores repassados para o Produtor devem ser lançados em sua contabilidade como obrigação perante terceiros, sendo o Produtor responsável pelo recolhimento dos tributos incidentes sobre a receita oriunda da totalidade dos ingressos vendidos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.4. O Produtor deverá cadastrar os dados bancários para repasse dos valores arrecadados até a data de realização do evento. O Produtor será exclusivamente responsável por qualquer equívoco ou atraso no cadastramento dos dados bancários.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    8.5. A TicketHall poderá, a qualquer tempo, reter e/ou compensar, sem limite de valor, os valores arrecadados de eventos na Plataforma, visando o cumprimento de ordens judiciais, resolução de conflitos ou reclamações, processos administrativos ou judiciais, disputas entre Produtores e Participantes, ações de cobrança ou qualquer situação que provoque a necessidade de retenção. O Produtor concorda que os valores permanecerão bloqueados até a liberação conforme a ordem das autoridades. A TicketHall não será responsável por prejuízos financeiros ou operacionais resultantes dessa retenção, desde que em conformidade com a legislação e ordens das autoridades.
                  </p>
                </section>

                {/* 9. Entrega e Utilização de Ingressos */}
                <section id="ingressos">
                  <h2 className="text-xl font-semibold text-foreground mb-4">9. Entrega e Utilização de Ingressos</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.1. Após a aprovação do pagamento, a confirmação da compra será enviada ao e-mail indicado pelo Comprador. Os ingressos estarão disponíveis na área "Meus Ingressos" da plataforma, que deverá ser utilizada para realizar o check-in e acesso ao evento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.1.1. Para acessar os ingressos, é necessário que os Participantes possuam uma conta ativa na Plataforma, vinculada ao e-mail da titularidade do ingresso, sendo indispensável que o Usuário cumpra integralmente os termos e condições para criação de conta indicados nestes Termos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.2. Os ingressos são associados a Códigos de Acesso (QR Codes) que permitem a validação no momento do acesso ao evento. O código terá validade limitada e poderá ser atualizado ou reemitido conforme necessário.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.3. É responsabilidade do Comprador e/ou Participante manter os ingressos em segurança após o recebimento, garantindo o sigilo dos códigos e das informações, e evitando a divulgação pública ou acesso por terceiros.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.4. Os ingressos comprados por meio da Plataforma são nominais, cabendo ao Produtor decidir pela conferência dessa informação no momento de acesso ao evento. A não conferência dessa informação pelo Produtor não gerará qualquer tipo de expectativa de direito ou indenização em face da TicketHall.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.5. Os ingressos adquiridos na Plataforma podem ser usados para acesso ao evento uma única vez. O check-in, ou seja, a leitura e validação do QR Code dos ingressos, é de responsabilidade do Produtor.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.5.1. O acesso ao evento não será liberado caso o check-in do ingresso já tenha sido realizado anteriormente, salvo por decisão exclusiva do Produtor em cada situação específica.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.6. A TicketHall poderá enviar comunicações relacionadas aos ingressos e/ou aos eventos, sendo responsabilidade dos Compradores e Participantes garantir que seus sistemas anti-spam ou filtros não interfiram no recebimento dessas mensagens. A ausência de acesso a qualquer e-mail ou mensagem não será considerada justificativa válida.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    9.7. A TicketHall disponibiliza as ferramentas necessárias para o correto controle de entrada nos eventos. A não utilização dessas ferramentas, bem como os problemas decorrentes dessa decisão, são de exclusiva responsabilidade do Produtor.
                  </p>
                </section>

                {/* 10. Cancelamento e Reembolso */}
                <section id="cancelamento">
                  <h2 className="text-xl font-semibold text-foreground mb-4">10. Cancelamentos, Estornos e Reembolsos</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.1. Em caso de reembolsos pendentes, alegações de fraude, reclamações de Usuários, cancelamento, adiamento, não realização ou alteração substancial do Evento, a TicketHall, na condição de custodiante dos valores arrecadados devidos ao Produtor, reserva-se o direito de reter e bloquear, a seu exclusivo critério e pelo tempo considerado necessário, os valores para adoção das medidas cabíveis e preservação de seus direitos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.1.1. Caso o Produtor não tome as medidas necessárias para reembolsar os Compradores em tempo hábil, a TicketHall se reserva o direito de fazê-lo, sem necessidade de autorização expressa ou comunicação prévia. Neste caso, a TicketHall poderá reter, compensar ou cobrar do Produtor os custos operacionais e administrativos relacionados ao processamento desses reembolsos.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.2. A TicketHall irá conduzir as disputas abertas pelos Compradores, tais como chargebacks, reclamações diversas, cancelamento e estornos, e poderá iniciar e processar cancelamentos sem a necessidade da intervenção ou aprovação do Produtor, nos casos de:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">a) não cumprimento da política de reembolsos do evento e/ou do Código de Defesa do Consumidor por parte do Produtor;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">b) detecção de indícios de fraude em compras realizadas, estejam elas pendentes de aprovação ou já aprovadas;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">c) cancelamento, adiamento ou alteração substancial do Evento;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">d) erro técnico no processamento da transação;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">e) número elevado de queixas/reclamações referentes a um determinado evento.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.3. O Produtor se obriga a comunicar imediatamente à TicketHall sempre que houver uma alteração substancial no Evento, como cancelamento, alteração de data, horário, local ou qualquer outra alteração relevante que possa impactar o Comprador.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.4. É obrigação do Produtor arcar integralmente com o reembolso de todos os ingressos adquiridos pelos Compradores, independentemente do motivo, caso o Evento não ocorra ou não seja entregue conforme as condições anunciadas. É assegurado à TicketHall o direito de regresso contra o Produtor por quaisquer valores que seja compelida a pagar aos Compradores ou terceiros.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.5. A Plataforma permite que o Produtor solicite à TicketHall, até o 2º dia útil após o término do Evento, o cancelamento de uma venda e o consequente reembolso do valor do ingresso para o Comprador, descontadas as taxas aplicáveis.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.6. É de responsabilidade do Comprador informar-se previamente sobre a política específica de cancelamento do Evento e, caso necessário, entrar em contato diretamente com o Produtor para solicitar o cancelamento e o consequente reembolso.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.7. O reembolso seguirá os seguintes procedimentos conforme a forma de pagamento: (i) cartão de crédito: estorno no mesmo cartão utilizado, podendo ocorrer na fatura seguinte ou subsequente, em prazo de até 90 (noventa) dias; (ii) PIX: reembolso processado para a mesma conta utilizada no pagamento, em até 5 (cinco) dias úteis; (iii) boleto bancário: o Comprador receberá solicitação de preenchimento de dados bancários para efetivação do reembolso.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    10.8. Em caso de arrependimento da compra, o Comprador terá direito ao reembolso do valor do ingresso, descontadas as taxas aplicáveis, desde que a solicitação seja realizada no prazo máximo de até 7 (sete) dias corridos contados da data da compra, conforme o Código de Defesa do Consumidor (Lei nº 8.078/90). Se o pedido for feito dentro desse prazo, o reembolso somente será aceito se a solicitação ocorrer com, no mínimo, 48 (quarenta e oito) horas de antecedência em relação ao início do Evento.
                  </p>
                </section>

                {/* 11. Transferência de Ingressos */}
                <section id="transferencia">
                  <h2 className="text-xl font-semibold text-foreground mb-4">11. Transferência de Titularidade dos Ingressos</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.1. O Comprador que adquirir ingressos para outros Participantes deverá identificá-los por meio dos respectivos e-mails, no momento da compra ou posteriormente, para que estes possam receber os ingressos em suas próprias contas. Após a transferência do ingresso, o Comprador poderá visualizar apenas o pedido, mas o QR Code não estará disponível em seu dispositivo.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.1.1. Caso a identificação do Participante não seja feita no momento da compra, o Comprador poderá realizar a transferência posteriormente. A não transferência impede o uso dos ingressos pelos Participantes, mantendo-os acessíveis apenas na conta do Comprador.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.1.2. A transferência de titularidade do ingresso só poderá ser realizada uma única vez pelo Comprador, em até 24 (vinte e quatro) horas do horário previsto para início do Evento, ou de acordo com as regras individualmente estipuladas pelos Produtores, quando configurada na Plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.2. O Participante não poderá realizar transferências de titularidade, salvo quando o Comprador e o Participante forem a mesma pessoa.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    11.3. A TicketHall se responsabiliza apenas pela devolução ao Comprador, não assumindo qualquer responsabilidade por repasses de valores ao Participante, nem por compras efetuadas fora da Plataforma ou em pontos não oficiais de vendas.
                  </p>
                </section>

                {/* 12. Responsabilidades */}
                <section id="responsabilidades">
                  <h2 className="text-xl font-semibold text-foreground mb-4">12. Responsabilidades</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.1. Os Usuários se obrigam a utilizar a Plataforma de maneira ética, lícita e adequada aos propósitos estabelecidos nestes Termos de Uso, observando a legislação brasileira vigente, comprometendo-se a não realizar qualquer atividade que constitua violação das referidas normas.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.2. Ao utilizar a Plataforma, o Comprador reconhece e se obriga a:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">a) Inserir dados corretos, completos e atualizados no cadastro e na aquisição dos ingressos. Caso contrário, a TicketHall poderá suspender o acesso;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">b) Efetuar o pagamento integral dos valores cobrados por meio dos meios de pagamento disponíveis na Plataforma;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">c) Comprar os ingressos exclusivamente por meio da Plataforma ou em pontos de venda autorizados. A TicketHall não se responsabiliza por transações realizadas fora de seus canais oficiais;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">d) Participar do processo de apuração de eventuais fraudes, fornecendo informações e documentos solicitados;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">e) Promover a segurança do ingresso, não divulgando-o publicamente, sobretudo em redes sociais.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.3. Ao criarem eventos na Plataforma, os Produtores devem:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">a) Publicar eventos verdadeiros e com informações completas, sendo responsabilidade do Produtor comunicar com exatidão: local, data, horário, valores, atrações, serviços oferecidos, contato, política de cancelamento, política de meia-entrada, restrição de faixa etária e qualquer outra informação relevante;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">b) Publicar apenas eventos que tenha direito e capacidade de realizar, declarando possuir todas as autorizações, alvarás, licenças e permissões necessárias para sua execução;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">c) Não agir como qualquer outra pessoa ou entidade, sob pena de responsabilização civil e criminal;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">d) Cadastrar corretamente os dados bancários para o repasse dos valores antes do início das vendas;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">e) Utilizar a TicketHall somente para a comercialização de ingressos para Eventos hospedados na Plataforma;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">f) Realizar eventos presenciais apenas em locais com prévia e expressa permissão governamental, cumprindo todos os protocolos de segurança e saúde aplicáveis.</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.4. Os serviços prestados pela TicketHall se limitam a fornecer tecnologia para que os Produtores possam divulgar, vender e gerir os seus eventos. A TicketHall não organiza, produz ou gerencia os eventos. Toda e qualquer responsabilidade pela realização dos eventos é exclusiva do Produtor, incluindo reclamações de consumidores, notificações de órgãos públicos, autuações ou processos. O Produtor obriga-se a manter a TicketHall indene e a indenizá-la integralmente por quaisquer custos, multas, prejuízos ou despesas decorrentes.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.5. O Produtor isenta a TicketHall de qualquer responsabilidade de natureza trabalhista, regulatória, previdenciária, securitária, civil, fiscal, criminal ou consumerista, advinda dos atos referentes à produção e realização de eventos. Havendo condenação judicial contra a TicketHall, esta poderá efetuar, imediatamente, a cobrança do valor que for obrigada a pagar, sem a necessidade de ajuizamento de ação de regresso.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.6. O Usuário isenta a TicketHall de qualquer dano nos casos de paralisações, parciais ou totais, dos seus serviços, decorrentes de falta temporária de energia elétrica, de pane nos serviços das concessionárias, falhas em serviços de telecomunicações, greves, tumultos, pandemias ou quaisquer outros fatos que não estejam diretamente ligados ao serviço. A TicketHall também não será responsável por qualquer dano causado por motivo de caso fortuito ou força maior.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.7. Fica expressamente estabelecido que a TicketHall não tem obrigação de controlar todas as ações executadas pelos Usuários no uso da Plataforma e, por conseguinte, não poderá ser responsabilizada pelos atos de seus Usuários, inclusive aqueles de caráter ilícito, imoral ou antiéticos, cabendo a estes responderem pessoal e exclusivamente por eventuais reclamações ou demandas judiciais, devendo manter a TicketHall livre e indene de qualquer responsabilidade ou ônus.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    12.8. A TicketHall não se responsabiliza por qualquer dano, direto ou indireto, ocasionado por eventos de terceiros, como ataques de hackers, falhas no sistema, no servidor ou na conexão à internet, inclusive por ações de programas maliciosos como vírus, cavalos de tróia e outros que possam danificar o equipamento ou a conexão dos Usuários em decorrência do acesso, utilização ou navegação na Plataforma, salvo se tal fato decorrer de dolo ou culpa da TicketHall.
                  </p>
                </section>

                {/* 13. Propriedade Intelectual */}
                <section id="propriedade">
                  <h2 className="text-xl font-semibold text-foreground mb-4">13. Direitos de Propriedade Intelectual</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    13.1. O uso comercial da expressão "TicketHall" ou suas derivações, em relação a marca, nome empresarial ou nome de domínio, bem como os conteúdos das telas relativas aos serviços da TicketHall, os programas, "look and feel" dos sites, bancos de dados, redes e arquivos que permitem ao Usuário acessar e usar sua conta, são de titularidade da TicketHall e estão protegidos pelas leis e tratados internacionais de direito autoral, marcas, patentes, modelos e desenhos industriais. O uso indevido e a reprodução total ou parcial dos referidos conteúdos são proibidos, salvo autorização prévia e expressa por escrito da TicketHall.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    13.2. A Plataforma pode manter links com outros sites, o que não significa que esses sites sejam de propriedade ou operados pela TicketHall, que não possui controle sobre sites de terceiros, razão pela qual não será responsável pelos seus conteúdos, práticas e serviços ofertados.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    13.3. O Usuário assume total responsabilidade por todos os prejuízos, diretos e indiretos, inclusive indenização, lucros cessantes, honorários advocatícios e demais encargos judiciais e extrajudiciais que a TicketHall seja obrigada a incorrer em virtude de ato ou omissão do Usuário, incluindo violações de propriedade intelectual.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    13.4. Se a TicketHall receber alguma reclamação ou questionamento de terceiros quanto a violação de propriedade intelectual, poderá remover ou suspender o conteúdo em questão e aplicar as sanções cabíveis.
                  </p>
                </section>

                {/* 14. Segurança da Plataforma */}
                <section id="seguranca">
                  <h2 className="text-xl font-semibold text-foreground mb-4">14. Segurança da Plataforma</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    14.1. Não é permitido o acesso às áreas de programação da Plataforma, seu banco de dados ou qualquer outro conjunto de informações que faça parte da atividade de desenvolvimento e manutenção.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    14.2. Os Usuários não estão autorizados a realizar ou permitir engenharia reversa, nem traduzir, decompilar, copiar, modificar, reproduzir, alugar, sublicenciar, publicar, divulgar, transmitir, emprestar, distribuir ou, de outra maneira, dispor das ferramentas de consulta da Plataforma e de suas funcionalidades.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    14.3. Na Plataforma é proibida a utilização de aplicativos spider, crawlers, mineração de dados, de qualquer tipo ou espécie, além de qualquer outra ferramenta que atue de modo automatizado, tanto para realizar operações massificadas, quanto para quaisquer outras finalidades.
                  </p>
                </section>

                {/* 15. Disposições Gerais */}
                <section id="disposicoes">
                  <h2 className="text-xl font-semibold text-foreground mb-4">15. Disposições Gerais</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.1. As demais Políticas da TicketHall são documentos integrantes do presente Termo de Uso e regulam assuntos específicos da relação entre as partes. Ao navegar pela Plataforma e utilizar suas funcionalidades, os Usuários aceitam todo o disposto nos presentes Termos de Uso e demais políticas vigentes na data de acesso. Cabe ao Usuário manter-se atualizado sobre possíveis alterações.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.2. Os serviços da TicketHall são direcionados a maiores de 18 (dezoito) anos. Menores de 18 anos poderão utilizar a Plataforma desde que devidamente autorizados ou assistidos por seus responsáveis legais. A TicketHall reserva-se o direito de solicitar comprovação de idade ou consentimento legal a qualquer momento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.3. Os presentes Termos de Uso estão sujeitos a constante melhoria e aprimoramento. A TicketHall se reserva o direito de modificá-los a qualquer momento, conforme a finalidade da Plataforma, tal qual para adequação e conformidade legal de disposição de lei ou norma que tenha força jurídica equivalente. Alterações significativas serão comunicadas por e-mail ou notificação na Plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.4. A eventual tolerância quanto a qualquer violação dos termos e condições deste documento será considerada mera liberalidade e não será interpretada como novação, precedente invocável, renúncia a direitos, alteração tácita dos termos contratuais, direito adquirido ou alteração contratual.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.5. Caso alguma disposição destes Termos de Uso for julgada inaplicável ou sem efeito, o restante das normas continua a viger, sem a necessidade de medida judicial que declare tal assertiva. Os Termos aqui descritos serão interpretados segundo a legislação brasileira.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.6. A TicketHall somente será obrigada a disponibilizar registros de acesso, informações pessoais ou comunicações privadas armazenadas em sua plataforma mediante ordem judicial ou requisição de autoridade policial ou administrativa competente.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.7. A comunicação entre a TicketHall e o Usuário deverá ser realizada pelos canais de atendimento indicados e disponibilizados na Plataforma. Para dúvidas sobre estes Termos, entre em contato pelo e-mail{" "}
                    <a href="mailto:contato@tickethall.com.br" className="text-primary hover:underline">contato@tickethall.com.br</a>.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    15.8. Sempre que possível, potenciais divergências entre o Usuário e a TicketHall serão resolvidas de forma amigável. Quando todos os esforços neste sentido forem esgotados, fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias ou queixas oriundas da utilização da Plataforma ou relacionadas a estes Termos de Uso, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                  </p>
                </section>

              </article>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
