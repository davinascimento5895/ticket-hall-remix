import { SEOHead } from "@/components/SEOHead";
import { LegalDocumentPage, type LegalSection } from "@/components/legal/LegalDocumentPage";

const summary = [
  {
    label: "Responsabilidade",
    value: "Integral do produtor",
    detail: "O produtor responde por conteúdo, evento, operação, terceiros contratados e obrigações legais aplicáveis.",
  },
  {
    label: "Repasse",
    value: "Sujeito a retenções e compensações",
    detail: "A TicketHall pode segurar valores para cobrir reembolsos, chargebacks, fraudes, disputas e ordens legais.",
  },
  {
    label: "Indenização",
    value: "Amplamente exigível",
    detail: "Custos, sanções, perdas e reclamações decorrentes do evento ou do conteúdo recaem sobre o produtor.",
  },
];

const sections: LegalSection[] = [
  {
    id: "objeto",
    title: "1. Objeto e natureza da relação",
    paragraphs: [
      "1.1. A TicketHall é uma plataforma tecnológica de intermediação e orquestração de vendas, validação e gestão de ingressos e serviços ligados a eventos. A TicketHall não é produtora, promotora, organizadora, patrocinadora ou coorganizadora do evento, nem assume responsabilidade por sua execução material, jurídica ou financeira.",
      "1.2. Estes Termos regem a relação entre a TicketHall e o Produtor. Ao criar eventos, anunciar conteúdo, ativar vendas, receber repasses ou continuar utilizando a plataforma após mudanças contratuais, o Produtor confirma que leu e aceitou este documento, a Política de Privacidade e as demais políticas aplicáveis.",
    ],
  },
  {
    id: "cadastro",
    title: "2. Cadastro, representação e verificação",
    paragraphs: [
      "2.1. O Produtor deve informar dados verdadeiros, completos e atualizados, inclusive CNPJ ou CPF, dados bancários, dados de contato, poderes de representação e informações necessárias ao KYC, à prevenção à fraude e ao cumprimento regulatório. A TicketHall pode solicitar documentos complementares, comprovação de identidade, validação societária, prova de poderes, verificação de beneficiário final e outras evidências antes ou depois da ativação da conta.",
      "2.2. Se houver inconsistência cadastral, indício de lavagem de dinheiro, financiamento ao terrorismo, fraude, cambismo, uso de conta de terceiro, violação de sanções, falsidade documental ou risco reputacional relevante, a TicketHall poderá suspender, limitar ou encerrar o acesso do Produtor sem necessidade de anuência prévia.",
    ],
    bullets: [
      "A conta e os direitos de acesso são pessoais e não podem ser cedidos sem autorização da TicketHall.",
      "A plataforma pode restringir acesso por análise de risco, compliance ou segurança.",
      "A ausência de resposta a pedidos de verificação pode impedir publicação, vendas ou repasses.",
    ],
  },
  {
    id: "publicacao",
    title: "3. Publicação de eventos e conformidade operacional",
    paragraphs: [
      "3.1. O Produtor é o único responsável pela verdade, completude e atualização de todas as informações do evento: data, horário, local, lotação, atrações, classificação etária, política de meia-entrada, acessibilidade, itens permitidos, regras de consumo, estacionamento, traslado, áreas restritas, uso de imagem, política de cancelamento e qualquer outro dado relevante para o cliente final.",
      "3.2. O Produtor declara possuir, antes da publicação, todas as licenças, autorizações, contratos, permissões, seguros, direitos de imagem, direitos musicais, direitos autorais, autorizações de terceiros, alvarás e demais condições necessárias ao evento. Caso o evento dependa de aval de local, artista, patrocinador, órgão público, autoridade sanitária, de trânsito, de turismo ou qualquer outro terceiro, a responsabilidade por obter e manter essa validação é integralmente do Produtor.",
    ],
    bullets: [
      "É vedada a criação de 'ingresso grátis' com cobrança posterior fora dos meios da plataforma.",
      "Também é vedado direcionar o comprador para transferências, links externos ou pagamentos paralelos para fugir das regras da TicketHall.",
      "A TicketHall pode moderar, suspender ou remover anúncios, artes, links, redirecionamentos e textos que violem a lei ou estas regras.",
    ],
    note: "Sempre que o evento envolver produtos, serviços ou atividades reguladas, o Produtor continua responsável por cumprir a legislação específica, inclusive de saúde, segurança, consumo, faixa etária, publicidade e fiscalização local.",
  },
  {
    id: "vendas",
    title: "4. Vendas, taxas, tributos e documentos fiscais",
    paragraphs: [
      "4.1. A cobrança dos valores, taxas e eventuais encargos seguirá as condições exibidas no fluxo de criação do evento, no plano contratado e nos parâmetros configurados pela TicketHall. A plataforma pode repassar custos de processamento, parcelamento, antifraude, chargeback, wallet, bilhetagem, operação e outras despesas operacionais permitidas no ambiente do produto.",
      "4.2. O Produtor é o responsável exclusivo por todos os tributos incidentes sobre a sua atividade e sobre a receita do evento, bem como pela emissão dos documentos fiscais devidos aos clientes finais, salvo se a TicketHall informar, de forma expressa, outra divisão para um caso específico. A existência de integração fiscal, automatização ou ferramenta de apoio não transfere a responsabilidade tributária ao sistema.",
    ],
    bullets: [
      "A TicketHall pode emitir documento fiscal apenas pelos serviços que presta, quando aplicável.",
      "O preço e a composição das taxas devem ser transparentes ao comprador antes da finalização da compra.",
      "Alterações de taxa, plano ou modelo de cobrança podem ocorrer conforme contrato, produto e versão vigente dos Termos.",
    ],
  },
  {
    id: "repasses",
    title: "5. Repasses, retenções, reservas e compensações",
    paragraphs: [
      "5.1. O repasse dos valores das vendas dependerá da confirmação do pagamento, do calendário do produto contratado, da conclusão dos prazos operacionais e da inexistência de pendências de risco, fraude, contestação, reembolso ou ordem de bloqueio. A TicketHall pode estabelecer reserva financeira, atraso de liberação, liberação parcial ou retenção total enquanto julgar necessário para proteção da operação, do comprador e da própria plataforma.",
      "5.2. A TicketHall poderá compensar automaticamente valores devidos pelo Produtor com créditos futuros, repasses pendentes, saldos em conta de pagamento, valores de outros eventos, contas vinculadas, saldos do mesmo titular, saldos de empresas associadas e quaisquer quantias legalmente passíveis de compensação, até o limite da obrigação apurada.",
    ],
    bullets: [
      "Chargebacks, reembolsos, cancelamentos, multas e custos de processamento podem ser abatidos dos repasses.",
      "A TicketHall pode solicitar documentos do evento, extratos, contratos, relatórios, notas e evidências de realização antes de liberar valores.",
      "Se houver dúvida relevante sobre a execução do evento, a TicketHall pode suspender pagamentos até a regularização.",
    ],
  },
  {
    id: "cancelamento",
    title: "6. Cancelamento, adiamento, reembolso e chargeback",
    paragraphs: [
      "6.1. O Produtor deve comunicar imediatamente qualquer cancelamento, adiamento, troca de local, alteração de horário, mudança substancial de atração, redução relevante de oferta, problema de segurança, limitação de acesso ou qualquer fato que possa afetar o comprador. A omissão dessa informação é descumprimento grave destes Termos.",
      "6.2. Se o evento não ocorrer, não puder ser entregue como anunciado ou gerar obrigação de devolução ao cliente, o Produtor responde integralmente pelos reembolsos, custos e consequências financeiras. A TicketHall pode, se necessário, executar reembolsos diretamente, sem autorização adicional, e depois cobrar o montante do Produtor por compensação, faturamento, débito direto ou cobrança posterior.",
    ],
    bullets: [
      "O Produtor deve manter regras de cancelamento compatíveis com a lei e com o evento anunciado.",
      "A TicketHall pode disputar chargebacks e contestações com base em provas fornecidas pelo Produtor.",
      "Se o Produtor não colaborar com a apuração, a TicketHall pode adotar medidas preventivas, inclusive bloquear novos eventos e repasses.",
    ],
  },
  {
    id: "dados",
    title: "7. Dados, marketing, conteúdo e propriedade intelectual",
    paragraphs: [
      "7.1. Quando o Produtor tratar dados pessoais por conta própria, inclusive listas, e-mails, WhatsApp, campanhas, formulários e ferramentas externas, ele atua como controlador ou responsável pelo tratamento, devendo cumprir a LGPD e manter a TicketHall livre de qualquer responsabilidade decorrente de uso indevido, base legal inexistente, vazamento, compartilhamento não autorizado ou descumprimento de dever de informação.",
      "7.2. O Produtor também garante que possui todos os direitos sobre imagens, logos, vídeos, músicas, textos, marcas, roteiros, artes e materiais publicados na plataforma. Se houver reclamação de terceiro, a TicketHall poderá remover, ocultar, limitar, suspender ou encerrar o conteúdo e, se necessário, o evento, sem gerar direito a indenização ao Produtor.",
    ],
    bullets: [
      "O Produtor não pode usar spam, bases compradas, contatos obtidos irregularmente ou mensagens que violem normas de publicidade.",
      "A TicketHall pode monitorar conteúdo para fins de segurança, integridade da plataforma e conformidade regulatória.",
      "O Produtor deve responder por qualquer dano causado por conteúdo enganoso, ofensivo, ilícito ou fora da autorização concedida.",
    ],
  },
  {
    id: "responsabilidade",
    title: "8. Responsabilidade, indenização e suspensão",
    paragraphs: [
      "8.1. O Produtor responde de forma integral e exclusiva por tudo o que vier a público em seu evento ou em sua conta: produção, operação, atendimento, equipe, segurança, incidentes, acidentes, autorização de entrada, qualidade, publicidade, logística, armazenamento, alimentos, bebidas, mobilidade, acessibilidade e qualquer obrigação legal ou contratual relacionada ao evento.",
      "8.2. Caso a TicketHall seja demandada, notificada, multada, investigada ou condenada em razão de ato ou omissão do Produtor, este deverá reembolsar integralmente a TicketHall por todas as despesas, custas, honorários, condenações, acordos, multas, perdas, danos e desembolsos suportados. A TicketHall poderá cobrar esses valores imediatamente, com ou sem decisão judicial prévia, na máxima extensão permitida pela lei.",
    ],
    bullets: [
      "A TicketHall pode suspender, limitar ou encerrar a conta, o evento ou os repasses sem indenização se identificar risco operacional ou violação contratual.",
      "O Produtor não pode alegar falha da plataforma para eximir obrigação legal própria, salvo se a lei determinar o contrário.",
      "A responsabilidade do Produtor alcança terceiros por ele contratados, subcontratados ou autorizados.",
    ],
  },
  {
    id: "final",
    title: "9. Disposições finais",
    paragraphs: [
      "9.1. A TicketHall pode alterar estes Termos, suas taxas, fluxos, limites operacionais, políticas de retenção, regras de risco e integrações a qualquer tempo, com publicação da versão atualizada na plataforma. A continuidade do uso após a atualização representa aceitação da nova redação.",
      "9.2. A Política de Privacidade integra este documento. A eventual tolerância da TicketHall a descumprimentos anteriores não gera renúncia de direitos. Se alguma cláusula for considerada inválida, as demais permanecem em vigor. As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, com renúncia expressa a qualquer outro, salvo hipótese legal obrigatória em sentido diverso.",
    ],
    bullets: [
      "As comunicações formais devem ocorrer pelos canais oficiais da TicketHall.",
      "O Produtor deve manter-se informado sobre as atualizações da plataforma e da legislação aplicável.",
      "O uso contínuo da conta após ajustes operacionais ou contratuais reforça a concordância do Produtor com a nova versão.",
    ],
  },
];

export default function TermosProdutor() {
  return (
    <>
      <SEOHead
        title="Termos de Uso do Produtor — TicketHall"
        description="Leia os termos aplicáveis a produtores, organizadores e responsáveis por eventos na TicketHall, incluindo publicação, vendas, repasses, chargebacks e indenização."
      />

      <LegalDocumentPage
        eyebrow="Produtor"
        title="Termos de Uso do Produtor"
        description="Este documento regula o uso da TicketHall por produtores, organizadores e responsáveis por eventos. Ele foi estruturado para proteger a plataforma em primeiro lugar, preservar a integridade das operações e atribuir ao produtor toda a responsabilidade pela execução, pela conformidade e pela entrega do evento."
        lastUpdated="13 de abril de 2026"
        summary={summary}
        actions={[
          { label: "Voltar à central", href: "/termos-de-uso", variant: "outline" },
          { label: "Ver termo do cliente", href: "/termos-de-uso/cliente" },
        ]}
        sections={sections}
        footerNote={(
          <>
            Para dúvidas operacionais e de cadastro, o canal oficial é o e-mail{" "}
            <a href="mailto:suporte@tickethall.com.br" className="text-primary hover:underline">
              suporte@tickethall.com.br
            </a>
            . Questões de privacidade devem ser tratadas na Política de Privacidade.
          </>
        )}
      />
    </>
  );
}