import { SEOHead } from "@/components/SEOHead";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

const summary = [
  {
    label: "Compra",
    value: "Somente por canais oficiais",
    detail: "A aprovação de pagamento, a liberação do ingresso e a validade do pedido dependem da análise da plataforma.",
  },
  {
    label: "Revenda",
    value: "Apenas oficial e habilitada",
    detail: "A transferência ou revenda fora da TicketHall fica por conta e risco do usuário.",
  },
  {
    label: "Reembolso",
    value: "Pelos meios previstos na lei",
    detail: "As hipóteses legais e a política do evento são respeitadas, com processamento pelos canais oficiais.",
  },
];

const sections: LegalSection[] = [
  {
    id: "objeto",
    title: "1. Objeto e aceitação",
    paragraphs: [
      "1.1. A TicketHall é uma plataforma tecnológica de intermediação que permite a divulgação, a reserva, a venda, a entrega, a validação e, quando habilitado, a revenda oficial de ingressos e serviços vinculados a eventos cadastrados por produtores independentes. A TicketHall não organiza, não produz, não patrocina, não endossa e não garante a execução dos eventos anunciados.",
      "1.2. Estes Termos regulam o relacionamento entre a TicketHall e o Cliente Final. Ao navegar, comprar, transferir, revender, resgatar ou utilizar ingressos, o usuário confirma que leu e aceitou este documento, a Política de Privacidade e as demais políticas vigentes. Se não concordar com qualquer cláusula, o uso da plataforma deve ser interrompido.",
    ],
  },
  {
    id: "definicoes",
    title: "2. Definições essenciais",
    paragraphs: [
      "2.1. Para estes Termos, 'Cliente Final' significa a pessoa que compra ou utiliza ingressos, ainda que em nome de terceiros. 'Produtor' é o responsável pelo evento e pelo conteúdo publicado. 'Ingresso' inclui, conforme o caso, QR Code, código de acesso, voucher, credencial, reserva, bilhete ou documento equivalente. 'Revenda Oficial' é a funcionalidade de transferência ou nova oferta feita dentro da TicketHall quando essa opção estiver habilitada pelo evento.",
      "2.2. 'Contestação', 'Chargeback' e 'Estorno' têm o sentido usual no mercado de pagamentos e podem ocorrer por iniciativa do titular do cartão, da instituição financeira, do processador de pagamento ou da própria TicketHall, conforme a análise de risco e a legislação aplicável.",
    ],
  },
  {
    id: "cadastro",
    title: "3. Cadastro, idade e segurança",
    paragraphs: [
      "3.1. O usuário é responsável por fornecer dados verdadeiros, completos e atualizados, inclusive dados de pagamento e de identificação. A TicketHall poderá solicitar confirmação adicional de identidade, documentos, validação facial, prova de titularidade do meio de pagamento ou outras informações necessárias para prevenção à fraude, ao cambismo e ao uso indevido da conta.",
      "3.2. Os serviços da plataforma são direcionados a maiores de 18 anos. Menores de idade somente poderão utilizar a plataforma se estiverem legalmente assistidos ou autorizados por seus responsáveis, quando a legislação permitir. A TicketHall poderá bloquear, suspender ou recusar contas quando identificar inconsistência cadastral, indício de fraude, risco operacional ou violação destes Termos.",
    ],
    bullets: [
      "A conta é pessoal, e o login e a senha não devem ser compartilhados.",
      "A TicketHall pode pedir documentos sempre que houver indício de risco, inclusive para verificar idade e titularidade.",
      "A criação de perfis falsos, o uso de dados de terceiros sem autorização e a engenharia social são violações graves.",
    ],
  },
  {
    id: "compra",
    title: "4. Compra, pagamento e antifraude",
    paragraphs: [
      "4.1. Toda compra depende da seleção do produto, da confirmação dos dados informados e da aprovação do pagamento pelos meios disponíveis na plataforma. Até a aprovação final, o pedido é apenas pendente e nenhum ingresso, assento, vaga ou benefício está garantido.",
      "4.2. A TicketHall poderá submeter qualquer transação a análise de risco automatizada ou manual. Se houver inconsistência, suspeita de fraude, chargeback em potencial, divergência cadastral, erro técnico ou uso incompatível com os padrões de segurança da plataforma, a compra poderá ser recusada, suspensa, reprocessada ou cancelada, sem geração de direito a compensação automática.",
    ],
    bullets: [
      "A TicketHall pode pedir documentos adicionais antes ou depois da compra.",
      "Pagamentos fora dos canais oficiais não são reconhecidos pela plataforma.",
      "A aprovação de pagamento não afasta verificações posteriores de fraude ou irregularidade.",
    ],
  },
  {
    id: "ingressos",
    title: "5. Ingressos, acesso e uso",
    paragraphs: [
      "5.1. Após a aprovação da compra, o ingresso poderá ser disponibilizado no aplicativo, na área logada, por e-mail ou por outro meio indicado na jornada de compra. O Cliente Final é responsável por manter o código, o QR Code, o link de acesso e quaisquer credenciais em sigilo, evitando captura de tela, publicação pública ou compartilhamento indevido.",
      "5.2. O ingresso pode ser nominal, dinâmico, reutilizável apenas em determinadas situações ou válido por apenas um acesso, conforme a configuração do evento. O produtor pode exigir documento oficial com foto, validação de titularidade, conferência de CPF, leitura biométrica ou qualquer outro controle compatível com a lei e com as regras do evento.",
    ],
    bullets: [
      "Ingressos já utilizados, copiados, adulterados ou revendidos fora do fluxo oficial podem ser cancelados.",
      "A ausência de bateria, internet ou aplicativo atualizado não gera obrigação de reentrada automática.",
      "A TicketHall pode enviar mensagens operacionais sobre a compra e o evento, e o usuário deve garantir que seus filtros de e-mail não bloqueiem esses avisos.",
    ],
  },
  {
    id: "revenda",
    title: "6. Revenda oficial e transferência",
    paragraphs: [
      "6.1. A revenda ou transferência de ingressos somente poderá ocorrer quando a funcionalidade estiver habilitada para o evento e sempre pelos meios oficiais da TicketHall. O produtor pode definir limites de quantidade, preço mínimo, preço máximo, prazo de oferta, exigência de titularidade e outras regras operacionais compatíveis com a legislação aplicável.",
      "6.2. A TicketHall não garante a validade de ingressos comprados fora da plataforma ou por canais não autorizados. Se o usuário adquirir ingresso em mercado paralelo, a responsabilidade pela autenticidade, pelo pagamento, pela entrega e pela eventual fraude é exclusiva das partes envolvidas fora da plataforma, sem qualquer responsabilidade da TicketHall.",
    ],
    bullets: [
      "A revenda oficial pode gerar taxa de serviço e outras cobranças informadas no fluxo de compra.",
      "Quando a revenda oficial for concluída, o ingresso original poderá ser invalidado e um novo código poderá ser emitido ao comprador final.",
      "A TicketHall pode suspender contas, ofertas e repasses em caso de cambismo, duplicidade, manipulação de preço ou uso abusivo do marketplace.",
    ],
    note: "A política operacional detalhada de revenda pode variar por evento e por configuração do produtor. Em caso de conflito, prevalecem a regra específica do evento, estes Termos e a legislação aplicável.",
  },
  {
    id: "cancelamento",
    title: "7. Cancelamento, arrependimento e reembolso",
    paragraphs: [
      "7.1. Os pedidos de cancelamento e reembolso devem ser feitos pelos canais oficiais. Quando houver hipótese legal de arrependimento, a TicketHall processará a solicitação na forma permitida pela lei e pelo meio de pagamento utilizado, observadas as regras operacionais necessárias para identificação do pedido e prevenção de fraude.",
      "7.2. Caso o evento seja cancelado, adiado, alterado de forma substancial ou não ocorra conforme anunciado, a TicketHall poderá, conforme o caso, reter valores, suspender repasses e executar reembolsos, inclusive sem aguardar instrução do produtor, para proteger o comprador e reduzir o risco de dano à plataforma. Nesses casos, os valores poderão ser debitados do saldo do produtor, compensados com outros créditos ou cobrados posteriormente, se necessário.",
    ],
    bullets: [
      "Reembolsos retornam, em regra, ao mesmo meio de pagamento usado na compra.",
      "A TicketHall pode pedir dados bancários adicionais quando a forma original não permitir devolução automática.",
      "A plataforma não responde por atrasos do emissor do cartão, do banco, da bandeira ou do processador de pagamento após o processamento do reembolso.",
    ],
  },
  {
    id: "conduta",
    title: "8. Conduta, uso proibido e segurança",
    paragraphs: [
      "8.1. É proibido usar a plataforma para fraude, cambismo, engenharia reversa, automação indevida, coleta massiva de dados, invasão de conta, manipulação de preços, criação de pedidos artificiais, burlar limites de compra, compartilhar códigos de acesso ou tentar contornar mecanismos de segurança.",
      "8.2. O usuário também não pode anunciar ou negociar pagamentos fora dos canais oficiais para fugir de taxas, validar ingresso sem pagamento, simular gratuidade ou induzir a TicketHall, o produtor ou outros usuários a erro. Qualquer violação pode gerar bloqueio, cancelamento da compra, invalidação do ingresso e outras medidas cabíveis.",
    ],
    bullets: [
      "Não use bots, spiders, crawlers ou ferramentas de scraping sem autorização expressa.",
      "Não publique nem compartilhe QR Codes, links privados ou credenciais de acesso em redes públicas.",
      "Não tente reverter, copiar ou explorar o software da plataforma.",
    ],
  },
  {
    id: "responsabilidade",
    title: "9. Limitação de responsabilidade",
    paragraphs: [
      "9.1. A TicketHall atua como intermediadora tecnológica. Assim, na máxima extensão permitida pela legislação aplicável, não responde pela organização do evento, pela qualidade da atração, pela lotação do local, pela segurança do espaço, pelo atendimento do produtor, por atos de terceiros, por links externos ou por qualquer relação que surja fora do ambiente da plataforma.",
      "9.2. Também não são de responsabilidade da TicketHall perdas indiretas, lucros cessantes, danos por atraso, danos morais, frustração de expectativa, despesas de deslocamento, hospedagem ou alimentação, salvo hipótese de dolo ou culpa exclusiva da TicketHall quando a lei assim exigir. Se a TicketHall for acionada por ato do usuário, este deverá manter a empresa indene e ressarcir custos e prejuízos suportados.",
    ],
  },
  {
    id: "final",
    title: "10. Propriedade intelectual e disposições finais",
    paragraphs: [
      "10.1. A marca TicketHall, o software, o layout, os textos institucionais, os fluxos de compra e os elementos visuais da plataforma pertencem à TicketHall ou a seus licenciantes. É proibido copiar, adaptar, reproduzir, descompilar, fazer engenharia reversa ou usar os elementos da plataforma para criar produto concorrente ou derivado sem autorização expressa.",
      "10.2. A Política de Privacidade integra estes Termos e explica como os dados são tratados. A TicketHall poderá alterar este documento a qualquer tempo, publicar nova versão na plataforma e comunicar mudanças relevantes pelos canais oficiais. Se alguma cláusula for considerada inválida, as demais permanecem em vigor. As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, com renúncia expressa a qualquer outro, salvo disposição legal obrigatória em sentido diverso.",
    ],
    bullets: [
      "Comunicações formais devem ocorrer pelos canais oficiais da TicketHall.",
      "O uso contínuo da plataforma após a publicação de nova versão indica concordância com o texto atualizado.",
      "Para dúvidas sobre estes Termos, use o suporte oficial da plataforma.",
    ],
  },
];

export default function TermosCliente() {
  return (
    <>
      <SEOHead
        title="Termos de Uso do Cliente Final — TicketHall"
        description="Leia os termos aplicáveis a compradores, participantes e demais clientes finais da TicketHall, incluindo compra, acesso, revenda oficial, cancelamento e reembolso."
      />

      <LegalDocumentPage
        eyebrow="Cliente Final"
        title="Termos de Uso do Cliente Final"
        description="Este documento organiza as regras para quem compra, transfere, revende ou utiliza ingressos na TicketHall. Ele prioriza a proteção da plataforma, preserva a integridade operacional do evento e esclarece os deveres do usuário em cada etapa da jornada."
        lastUpdated="13 de abril de 2026"
        summary={summary}
        actions={[
          { label: "Voltar à central", href: "/termos-de-uso", variant: "outline" },
          { label: "Ver termo do produtor", href: "/termos-de-uso/produtor" },
        ]}
        sections={sections}
        footerNote={(
          <>
            Dúvidas operacionais devem ser direcionadas ao suporte da TicketHall pelo e-mail{" "}
            <a href="mailto:suporte@tickethall.com.br" className="text-primary hover:underline">
              suporte@tickethall.com.br
            </a>
            . Questões de privacidade continuam sujeitas à Política de Privacidade da plataforma.
          </>
        )}
      />
    </>
  );
}