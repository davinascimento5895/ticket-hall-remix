import { SEOHead } from "@/components/SEOHead";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Como comprar ingressos?", a: "Acesse a página do evento, selecione o lote, adicione ao carrinho e finalize o pagamento via PIX, cartão ou boleto." },
  { q: "Posso parcelar?", a: "Sim! Aceitamos parcelamento em até 12x no cartão de crédito." },
  { q: "Como funciona o reembolso?", a: "Acesse 'Meus Ingressos', selecione o ingresso e clique em 'Solicitar Reembolso'. O prazo é de até 7 dias úteis." },
  { q: "Posso transferir meu ingresso?", a: "Sim. Acesse 'Meus Ingressos', clique em 'Transferir' e informe o e-mail do destinatário." },
  { q: "Como funciona a meia-entrada?", a: "Selecione o lote de meia-entrada ao comprar e apresente documento válido na entrada do evento." },
  { q: "Como criar um evento?", a: "Clique em 'Crie seu evento', faça login ou cadastro, preencha seus dados de produtor e comece a criar!" },
  { q: "Qual a taxa cobrada?", a: "O TicketHall cobra uma das menores taxas do mercado. Consulte a calculadora de taxas na página de produtores." },
  { q: "Meu QR Code não funciona, o que faço?", a: "Atualize a página, verifique o e-mail de confirmação e aumente o brilho da tela. Se persistir, entre em contato com o suporte." },
  { q: "O evento foi cancelado, como recebo o reembolso?", a: "Em caso de cancelamento pelo organizador, o reembolso é processado automaticamente em até 7 dias úteis." },
  { q: "Posso comprar ingressos para outra pessoa?", a: "Sim! Após a compra, transfira o ingresso informando o e-mail do destinatário." },
];

export default function FAQ() {
  return (
    <>
      <SEOHead title="Perguntas Frequentes — TicketHall" description="Tire suas dúvidas sobre compra de ingressos, reembolso, transferência e mais." />
      <div className="container max-w-2xl py-16 lg:py-24">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-center mb-2">Perguntas Frequentes</h1>
        <p className="text-muted-foreground text-center mb-10">Tire suas dúvidas sobre o TicketHall</p>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
