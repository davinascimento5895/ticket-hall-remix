import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  from: "user" | "bot";
  timestamp: Date;
}

const DISCLAIMER_MESSAGE: Message = {
  id: "disclaimer",
  text: "Olá! Sou o assistente automatizado da TicketHall. Posso ajudar com dúvidas frequentes. Para atendimento humano, envie um e-mail para suporte@tickethall.com.br.",
  from: "bot",
  timestamp: new Date(),
};

const quickReplies = [
  "Como comprar ingressos?",
  "Quero pedir reembolso",
  "Meu QR Code não funciona",
  "Como transferir ingresso?",
];

// FAQ responses with keyword matching
interface FaqItem {
  keywords: string[];
  response: string;
}

const faqItems: FaqItem[] = [
  {
    keywords: ["comprar", "compra", "adquirir", "ingresso", "ticket", "como compro", "quero comprar", "onde compro", "pagamento", "pagar", "pix", "cartão", "boleto", "forma de pagamento"],
    response: "Para comprar ingressos, acesse a página do evento, selecione o lote desejado, adicione ao carrinho e finalize o pagamento via PIX, cartão ou boleto. Aceitamos todas as bandeiras de cartão de crédito com parcelamento em até 12x.",
  },
  {
    keywords: ["reembolso", "reembolsar", "devolver", "devolução", "dinheiro de volta", "estorno", "cancelar compra", "cancelamento", "cancela", "reaver", "valor de volta", "quero meu dinheiro", "arrependimento", "desistir", "desistência"],
    response: "Para solicitar reembolso, acesse 'Meus Ingressos', selecione o ingresso e clique em 'Solicitar Reembolso'. O prazo para estorno é de até 7 dias úteis após aprovação. Lembre-se: reembolsos só podem ser solicitados até 48h antes do evento.",
  },
  {
    keywords: ["qr", "qrcode", "qr code", "código", "não funciona", "não aparece", "não leio", "erro", "problema", "entrada", "validar", "validação", "escanear", "scanner", "leitura"],
    response: "Se seu QR Code não está funcionando: 1) Atualize a página do ingresso; 2) Verifique o e-mail de confirmação para o QR Code original; 3) Aumente o brilho da tela; 4) Se persistir, entre em contato pelo e-mail suporte@tickethall.com.br com o número do pedido.",
  },
  {
    keywords: ["transferir", "transferência", "passar", "enviar", "presente", "dar", "nome", "trocar nome", "mudar nome", "outro nome", "amigo", "familiar"],
    response: "Para transferir seu ingresso: acesse 'Meus Ingressos', selecione o ingresso desejado e clique em 'Transferir'. Informe o e-mail do destinatário e confirme. O destinatário receberá o ingresso automaticamente na conta dele.",
  },
  {
    keywords: ["meia", "meia-entrada", "estudante", "idoso", "desconto", "documento", "comprovante", "pcd", "deficiente", "professor", "doador"],
    response: "Para meia-entrada, você deve apresentar documento válido na entrada do evento (carteira de estudante, ID jovem, carteira de idoso, etc.). Ao comprar, selecione o lote de meia-entrada e tenha o documento em mãos no dia.",
  },
  {
    keywords: ["evento", "cancelado", "adiado", "remarcado", "nova data", "acontece", "vai ter", "confirmado"],
    response: "Se um evento for cancelado ou adiado, você será notificado por e-mail. Em caso de cancelamento, o reembolso é automático. Para adiamentos, seu ingresso continua válido para a nova data, ou você pode solicitar reembolso.",
  },
  {
    keywords: ["conta", "login", "senha", "acessar", "entrar", "cadastro", "cadastrar", "email", "não consigo entrar", "esqueci"],
    response: "Problemas com acesso? Clique em 'Esqueci minha senha' na tela de login para redefinir. Se o problema persistir, verifique se está usando o mesmo e-mail do cadastro. Para mais ajuda: suporte@tickethall.com.br",
  },
  {
    keywords: ["horário", "hora", "quando", "que horas", "abertura", "portão", "entrada", "começa", "início"],
    response: "O horário de abertura dos portões e início do evento estão na página do evento. Recomendamos chegar com antecedência para evitar filas. Confira os detalhes completos na sua confirmação de compra.",
  },
  {
    keywords: ["local", "endereço", "onde", "localização", "como chegar", "mapa", "estacionamento"],
    response: "O endereço completo do evento está na página do evento e no seu ingresso. Clique no endereço para abrir no mapa. Informações sobre estacionamento também estão disponíveis na descrição do evento.",
  },
  {
    keywords: ["ajuda", "suporte", "contato", "falar", "atendimento", "problema", "dúvida", "humano", "atendente"],
    response: "Para suporte personalizado, envie um e-mail para suporte@tickethall.com.br com o número do seu pedido e descreva seu problema. Nossa equipe responde em até 24 horas úteis.",
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function getBotResponse(text: string): string {
  const normalizedInput = normalizeText(text);
  const inputWords = normalizedInput.split(/\s+/);
  
  let bestMatch: { item: FaqItem; score: number } | null = null;
  
  for (const item of faqItems) {
    let score = 0;
    for (const keyword of item.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      // Check if keyword appears in input
      if (normalizedInput.includes(normalizedKeyword)) {
        score += normalizedKeyword.length; // Longer matches = higher score
      }
      // Check individual words
      for (const word of inputWords) {
        if (normalizedKeyword.includes(word) && word.length >= 3) {
          score += 1;
        }
      }
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item, score };
    }
  }
  
  if (bestMatch && bestMatch.score >= 2) {
    return bestMatch.item.response;
  }
  
  return "Entendi! Para suporte personalizado, envie um e-mail para suporte@tickethall.com.br ou aguarde — em breve teremos atendimento ao vivo por aqui. Você também pode tentar perguntar de outra forma.";
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DISCLAIMER_MESSAGE]);
  const [input, setInput] = useState("");
  const location = useLocation();

  // Hide on admin/producer panels and staff portal
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/producer") ||
    location.pathname.startsWith("/staff")
  ) return null;

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), text, from: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: Message = { id: crypto.randomUUID(), text: getBotResponse(text), from: "bot", timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="chat-fab"
            initial={false}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <button
              onClick={() => setOpen(true)}
              className="fixed bottom-20 md:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 z-50 w-[340px] max-h-[480px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Suporte TicketHall</p>
                  <p className="text-[10px] text-accent">● Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                className="text-sm bg-secondary border-border-strong"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              />
              <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
