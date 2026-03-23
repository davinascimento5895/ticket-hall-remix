export interface FAQItem {
  question: string;
  answer: string;
}

export const buyerFAQItems: FAQItem[] = [
  {
    question: "Como compro ingressos?",
    answer:
      "Acesse a página do evento, escolha ingressos e finalize o pagamento via PIX, cartão ou boleto. Seus ingressos chegam por e-mail e ficam disponíveis em 'Meus Ingressos'.",
  },
  {
    question: "É seguro comprar pelo TicketHall?",
    answer:
      "Sim. Usamos criptografia, não armazenamos dados completos de cartão e monitoramos transações para evitar fraudes. Seguimos LGPD e usamos gateways certificados.",
  },
  {
    question: "Posso transferir meu ingresso?",
    answer:
      "Sim. Na área 'Meus Ingressos', clique em 'Transferir' e informe o e-mail do novo titular. A transferência é gratuita e o recebimento é automático.",
  },
  {
    question: "Como funciona o reembolso?",
    answer:
      "Reembolso automático em caso de cancelamento de evento. Para desistência ou mudança de data, solicite com antecedência no painel do evento, conforme política do produtor.",
  },
  {
    question: "Meu ingresso é digital ou preciso imprimir?",
    answer:
      "Ingressos são digitais com QR Code. Apresente pelo celular no acesso, não é necessária impressão.",
  },
  {
    question: "Como funciona o check-in no evento?",
    answer:
      "Na entrada abra o ingresso e mostre o QR Code. O responsável escaneia e libera sua entrada, normalmente em segundos.",
  },
  {
    question: "Posso parcelar minha compra?",
    answer:
      "Cartão em até 12x (até 3x sem juros), além de PIX e boleto. Escolha a forma no checkout.",
  },
];

export const producerFAQItems: FAQItem[] = [
  {
    question: "Quanto custa usar a plataforma para vender ingressos?",
    answer:
      "A cobrança é percentual sobre as vendas realizadas. Não há mensalidade obrigatória para começar, e você acompanha os valores com transparência no painel do produtor.",
  },
  {
    question: "Como funciona o repasse dos valores das vendas?",
    answer:
      "Os repasses seguem o fluxo configurado para o seu evento e ficam visíveis no financeiro. Você acompanha o status de cada venda e tem previsibilidade para planejar caixa e fornecedores.",
  },
  {
    question: "Posso criar eventos gratuitos e pagos na mesma conta?",
    answer:
      "Sim. Você pode publicar eventos gratuitos, pagos ou mistos, criar diferentes tipos de ingressos e organizar lotes com regras específicas conforme a estratégia do seu evento.",
  },
  {
    question: "Consigo personalizar lotes, viradas e cupons de desconto?",
    answer:
      "Sim. É possível configurar lotes com quantidades e preços diferentes, controlar viradas por data e horário e aplicar cupons por valor fixo ou percentual com limite e validade.",
  },
  {
    question: "Como funciona o check-in no dia do evento?",
    answer:
      "O check-in é feito por leitura de QR Code, com validação rápida para evitar filas. Você também pode acompanhar entradas em tempo real para ter visão clara da operação na porta.",
  },
  {
    question: "Dá para ter equipe com acessos diferentes para operar o evento?",
    answer:
      "Sim. Você pode organizar a operação com membros de equipe e permissões por função, separando responsabilidades como check-in, atendimento e gestão do evento.",
  },
  {
    question: "Consigo vender itens extras além do ingresso?",
    answer:
      "Sim. Você pode adicionar produtos e serviços complementares para aumentar o ticket médio, como experiências, itens promocionais e outros adicionais do evento.",
  },
  {
    question: "A plataforma oferece suporte para quem está começando?",
    answer:
      "Sim. O fluxo de criação é guiado, com recursos pensados para facilitar publicação, gestão e acompanhamento das vendas mesmo para quem está organizando o primeiro evento.",
  },
];

export const allFAQItems = { buyer: buyerFAQItems, producer: producerFAQItems };
