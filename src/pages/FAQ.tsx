import { SEOHead } from "@/components/SEOHead";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buyerFAQItems, producerFAQItems } from "@/data/faq-data";

export default function FAQ() {
  return (
    <>
      <SEOHead title="Perguntas Frequentes — TicketHall" description="Tire suas dúvidas sobre compra de ingressos, reembolso, transferência e mais." />
      <div className="container max-w-2xl py-16 lg:py-24">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-center mb-2">Perguntas Frequentes</h1>
        <p className="text-muted-foreground text-center mb-10">Tire suas dúvidas sobre o TicketHall</p>

        <h2 className="font-display text-xl lg:text-2xl font-bold mb-4">Para compradores</h2>
        <Accordion type="single" collapsible className="space-y-2 mb-12">
          {buyerFAQItems.map((faq, i) => (
            <AccordionItem key={`buyer-${i}`} value={`buyer-${i}`} className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="font-display text-xl lg:text-2xl font-bold mb-4">Para produtores</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {producerFAQItems.map((faq, i) => (
            <AccordionItem key={`producer-${i}`} value={`producer-${i}`} className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}
