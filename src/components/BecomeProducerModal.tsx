import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, validateCPF, formatPhone } from "@/lib/validators";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

interface BecomeProducerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeProducerModal({ open, onOpenChange }: BecomeProducerModalProps) {
  const { user, profile } = useAuth();
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      toast.error("CPF inválido");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Telefone inválido");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          cpf: cleanCpf,
          phone: cleanPhone,
          producer_status: "pending",
        })
        .eq("id", user.id);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => setSubmitted(false), 300);
  };

  // Already pending
  if (profile?.producer_status === "pending") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Aguardando aprovação
            </DialogTitle>
            <DialogDescription>
              Sua solicitação para se tornar produtor está sendo analisada. Você receberá uma notificação quando for aprovado.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose} className="w-full mt-4">
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Solicitação enviada!
            </DialogTitle>
            <DialogDescription>
              Recebemos sua solicitação para se tornar produtor. Nossa equipe irá analisar e você será notificado em breve.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose} className="w-full mt-4">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quero ser produtor</DialogTitle>
          <DialogDescription>
            Preencha seus dados para solicitar acesso como produtor de eventos. A aprovação é feita pela nossa equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCPFChange}
              maxLength={14}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={15}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar solicitação"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
