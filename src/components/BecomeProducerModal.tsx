import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, validateCPF, formatPhone } from "@/lib/validators";
import { Loader2 } from "lucide-react";

interface BecomeProducerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeProducerModal({ open, onOpenChange }: BecomeProducerModalProps) {
  const { user, profile, refetchRole } = useAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.functions.invoke("become-producer", {
        body: { cpf: cleanCpf, phone: cleanPhone },
      });

      if (error) throw error;

      toast.success("Conta de produtor ativada! Bem-vindo!");
      await refetchRole();
      onOpenChange(false);
      navigate("/producer/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao ativar conta de produtor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar conta de produtor</DialogTitle>
          <DialogDescription>
            Preencha seus dados para ativar sua conta de produtor e começar a criar eventos agora mesmo.
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
                Ativando conta...
              </>
            ) : (
              "Ativar conta de produtor"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
