import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronRight, HelpCircle, Send, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const FAQ_ITEMS = [
  { title: "Cancelamento ou reembolso de ingressos", link: "/faq" },
  { title: "Compra pendente", link: "/faq" },
  { title: "Troca de titularidade", link: "/faq" },
  { title: "Como acesso meu certificado", link: "/faq" },
  { title: "Não consigo acessar minha conta", link: "/faq" },
  { title: "Sobre emissão de nota fiscal", link: "/faq" },
];

interface ContactProducerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producerId: string;
  producerName: string;
  eventId?: string;
  eventTitle?: string;
}

export function ContactProducerModal({
  open,
  onOpenChange,
  producerId,
  producerName,
  eventId,
  eventTitle,
}: ContactProducerModalProps) {
  const { user, profile } = useAuth();
  const [showForm, setShowForm] = useState(false);

  // Reset to FAQ screen when modal reopens
  useEffect(() => {
    if (open) setShowForm(false);
  }, [open]);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Auto-fill from auth
  const handleShowForm = () => {
    if (!user) {
      toast({
        title: "Faça login para continuar",
        description: "Para enviar mensagem ao produtor, entre na sua conta primeiro.",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: prev.name || profile?.full_name || "",
      email: prev.email || user?.email || "",
    }));
    setShowForm(true);
  };

  const handleSend = async () => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para enviar uma mensagem.", variant: "destructive" });
      return;
    }
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const payload = {
        producer_id: producerId,
        sender_id: user.id,
        sender_name: formData.name,
        sender_email: formData.email,
        event_id: eventId || null,
        subject: formData.subject,
        message: formData.message,
      };

      let { error } = await supabase.from("producer_messages").insert(payload);
      if (error && /event_id/i.test(error.message || "")) {
        const { event_id: _ignored, ...legacyPayload } = payload;
        const legacyInsert = await supabase.from("producer_messages").insert(legacyPayload);
        error = legacyInsert.error;
      }

      if (error) throw error;
      toast({ title: "Mensagem enviada!", description: `Sua mensagem foi enviada para ${producerName}.` });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setShowForm(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setShowForm(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!showForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-display">Veja as dúvidas mais frequentes!</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Caso a sua não esteja aqui, consulte nossa{" "}
                <Link to="/faq" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>
                  Central de Ajuda!
                </Link>
              </p>
            </DialogHeader>

            <div className="divide-y divide-border">
              {FAQ_ITEMS.map((item) => (
                <Link
                  key={item.title}
                  to={item.link}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between py-3.5 text-sm text-foreground hover:text-primary transition-colors group"
                >
                  <span>{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Com dúvidas sobre o evento? Envie sua dúvida para o produtor!
              </p>
              <Button className="w-full" onClick={handleShowForm}>
                {user ? "Falar com produtor" : "Entrar para falar com produtor"}
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  É necessário estar logado para enviar mensagens ao organizador.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-display">Falar com {producerName}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem diretamente ao organizador{eventTitle ? ` sobre ${eventTitle}.` : "."}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    disabled={!!user}
                    className={user ? "bg-muted" : ""}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Assunto *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Qual o assunto?"
                />
              </div>
              <div>
                <Label className="text-xs">Mensagem *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Descreva sua dúvida ou solicitação..."
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Voltar
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSend} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar mensagem
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
