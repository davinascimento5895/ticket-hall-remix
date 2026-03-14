export interface FAQItem {
  question: string;
  answer: string;
}

export const buyerFAQItems: FAQItem[] = [
  {
    question: "Como compro ingressos?",
    answer:
      "Muito simples! Acesse a página do evento, escolha o tipo de ingresso e quantidade desejada. No checkout, informe seus dados e finalize com PIX (aprovação instantânea), cartão de crédito (em até 12x) ou boleto bancário. Seus ingressos chegam por e-mail em segundos!",
  },
  {
    question: "Posso transferir meu ingresso?",
    answer:
      "Sim! Na área 'Meus Ingressos', clique no botão 'Transferir' do ingresso desejado e informe o e-mail do destinatário. A transferência é gratuita e o novo titular recebe o ingresso digital automaticamente. Você pode acompanhar o status da transferência no seu painel.",
  },
  {
    question: "Como funciona o reembolso?",
    answer:
      "Se o evento for cancelado pelo produtor, o reembolso é automático e integral em até 5 dias úteis. Para outros casos (mudança de data, desistência), você pode solicitar reembolso através do painel 'Meus Ingressos' em até 7 dias antes do evento, sujeito à política de cada produtor.",
  },
  {
    question: "Meu ingresso é digital ou preciso imprimir?",
    answer:
      "Todos os ingressos do TicketHall são 100% digitais! Você recebe um QR Code único que fica no seu celular. Na entrada do evento, basta mostrar o QR Code na tela para fazer o check-in. Sem necessidade de impressão, mais sustentável e prático!",
  },
  {
    question: "Como funciona o check-in no evento?",
    answer:
      "É super rápido! Na entrada do evento, abra o e-mail com seu ingresso ou acesse 'Meus Ingressos' no site. Mostre o QR Code na tela do celular para o organizador escanear. O sistema valida automaticamente e libera sua entrada. Lembre-se de ter o documento de identidade em mãos!",
  },
  {
    question: "O que é a fila virtual?",
    answer:
      "Para eventos com alta demanda, alguns produtores ativam a fila virtual. Você entra na fila antes das vendas começarem e aguarda sua vez de comprar. Isso garante uma experiência mais justa e evita que o site trave. Você recebe notificações sobre sua posição na fila.",
  },
  {
    question: "Posso comprar para outras pessoas?",
    answer:
      "Sim! Durante a compra, você pode informar os dados de diferentes pessoas para cada ingresso. Cada ingresso terá o nome do titular para o check-in. Alternativamente, você pode comprar em seu nome e depois transferir os ingressos gratuitamente.",
  },
  {
    question: "É seguro comprar pelo TicketHall?",
    answer:
      "Completamente seguro! Utilizamos criptografia de ponta a ponta, não armazenamos dados do seu cartão, seguimos a LGPD rigorosamente e monitoramos transações 24/7 para prevenir fraudes. Todos os pagamentos são processados por gateways certificados e reconhecidos pelo Banco Central.",
  },
  {
    question: "Posso parcelar minha compra?",
    answer:
      "Sim! Aceitamos cartão de crédito em até 12x (em até 3x sem juros). Também oferecemos PIX com aprovação instantânea e boleto bancário com vencimento em 3 dias úteis. Escolha a forma que melhor se adequa ao seu orçamento.",
  },
  {
    question: "E se eu perder meu ingresso ou deletar o e-mail?",
    answer:
      "Sem problemas! Seus ingressos ficam salvos para sempre na área 'Meus Ingressos' do site. Basta fazer login com seu e-mail e senha. Você também pode solicitar o reenvio dos ingressos por e-mail a qualquer momento. Seus ingressos estão sempre seguros conosco!",
  },
  {
    question: "Posso alterar meus dados após a compra?",
    answer:
      "Dados como nome do titular e documento podem ser alterados através da área 'Meus Ingressos' até 24 horas antes do evento. Para outras alterações ou dúvidas específicas, entre em contato com o atendimento do evento através dos dados disponíveis na página do evento.",
  },
  {
    question: "Como sei se minha compra foi aprovada?",
    answer:
      "Você recebe confirmação por e-mail imediatamente após a aprovação do pagamento. PIX é instantâneo, cartão leva até alguns minutos, e boleto até 3 dias úteis. Você pode acompanhar o status em tempo real na área 'Meus Ingressos' e recebe notificações por e-mail sobre qualquer mudança.",
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
