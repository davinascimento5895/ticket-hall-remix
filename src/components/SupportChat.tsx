import { useState } from "react";
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

const quickReplies = [
  "Como comprar ingressos?",
  "Quero pedir reembolso",
  "Meu QR Code não funciona",
  "Como transferir ingresso?",
];

const faqResponses: Record<string, string> = {
  "como comprar ingressos?": "Para comprar ingressos, acesse a página do evento, selecione o lote desejado, adicione ao carrinho e finalize o pagamento via PIX, cartão ou boleto.",
  "quero pedir reembolso": "Para solicitar reembolso, acesse 'Meus Ingressos', selecione o ingresso e clique em 'Solicitar Reembolso'. O prazo é de até 7 dias úteis.",
  "meu qr code não funciona": "Tente atualizar a página ou acessar pelo e-mail de confirmação. Se persistir, entre em contato pelo e-mail suporte@tickethall.com.br.",
  "como transferir ingresso?": "Em 'Meus Ingressos', selecione o ingresso e clique em 'Transferir'. Informe o e-mail do destinatário e confirme a transferência.",
};

function getBotResponse(text: string): string {
  const key = text.toLowerCase().trim();
  for (const [q, a] of Object.entries(faqResponses)) {
    if (key.includes(q.split(" ").slice(0, 3).join(" "))) return a;
  }
  return "Entendi! Para suporte personalizado, envie um e-mail para suporte@tickethall.com.br ou aguarde — em breve teremos atendimento ao vivo por aqui.";
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Olá! 👋 Como posso ajudar?", from: "bot", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const location = useLocation();

  // Hide on admin/producer panels
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/producer")) return null;

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
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
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
