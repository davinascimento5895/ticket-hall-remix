import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { validateCPF, formatCPF, formatPhone } from "@/lib/validators";
import { fetchAddress, formatCEP } from "@/lib/cep";
import { useIBGEStates } from "@/hooks/useIBGELocations";
import { toast } from "@/hooks/use-toast";
import { User, Loader2 } from "lucide-react";

export interface BuyerData {
  fullName: string;
  email: string;
  birthDate: string;
  cpf: string;
  phone: string;
  cep: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CheckoutStepBuyerProps {
  buyerData: BuyerData;
  setBuyerData: React.Dispatch<React.SetStateAction<BuyerData>>;
  onNext: () => void;
}

export function CheckoutStepBuyer({ buyerData, setBuyerData, onNext }: CheckoutStepBuyerProps) {
  const { user, profile } = useAuth();
  const { states } = useIBGEStates();
  const [loadingCep, setLoadingCep] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Auto-fill from profile on first load (using AuthContext profile)
  useEffect(() => {
    if (profileLoaded || !user) return;

    if (profile) {
      setBuyerData((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || "",
        email: prev.email || user.email || "",
        cpf: prev.cpf || (profile.cpf ? formatCPF(profile.cpf) : ""),
        phone: prev.phone || (profile.phone ? formatPhone(profile.phone) : ""),
        birthDate: prev.birthDate || profile.birth_date || "",
        cep: prev.cep || (profile.cep ? formatCEP(profile.cep) : ""),
        street: prev.street || profile.street || "",
        addressNumber: prev.addressNumber || profile.address_number || "",
        complement: prev.complement || profile.complement || "",
        neighborhood: prev.neighborhood || profile.neighborhood || "",
        city: prev.city || profile.city || "",
        state: prev.state || profile.state || "",
      }));
    } else {
      setBuyerData((prev) => ({
        ...prev,
        email: prev.email || user.email || "",
      }));
    }
    setProfileLoaded(true);
  }, [user, profile, profileLoaded, setBuyerData]);

  // CEP auto-fill
  const handleCepChange = useCallback(async (rawValue: string) => {
    const formatted = formatCEP(rawValue);
    setBuyerData((prev) => ({ ...prev, cep: formatted }));

    const clean = rawValue.replace(/\D/g, "");
    if (clean.length === 8) {
      setLoadingCep(true);
      const address = await fetchAddress(clean);
      if (address) {
        setBuyerData((prev) => ({
          ...prev,
          street: address.street || prev.street,
          neighborhood: address.neighborhood || prev.neighborhood,
          city: address.city || prev.city,
          state: address.state || prev.state,
        }));
      }
      setLoadingCep(false);
    }
  }, [setBuyerData]);

  const handleValidateAndNext = () => {
    if (!buyerData.fullName.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha seu nome completo.", variant: "destructive" });
      return;
    }
    if (!buyerData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerData.email)) {
      toast({ title: "E-mail inválido", description: "Preencha um e-mail válido.", variant: "destructive" });
      return;
    }
    if (!buyerData.birthDate) {
      toast({ title: "Campo obrigatório", description: "Preencha sua data de nascimento.", variant: "destructive" });
      return;
    }
    if (!buyerData.cpf.trim() || !validateCPF(buyerData.cpf)) {
      toast({ title: "CPF inválido", description: "Preencha um CPF válido.", variant: "destructive" });
      return;
    }
    if (!buyerData.phone.trim() || buyerData.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Celular inválido", description: "Preencha um número de celular válido.", variant: "destructive" });
      return;
    }
    if (!buyerData.cep.trim() || buyerData.cep.replace(/\D/g, "").length !== 8) {
      toast({ title: "CEP inválido", description: "Preencha um CEP válido.", variant: "destructive" });
      return;
    }
    if (!buyerData.street.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o endereço.", variant: "destructive" });
      return;
    }
    if (!buyerData.addressNumber.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o número do endereço.", variant: "destructive" });
      return;
    }
    if (!buyerData.neighborhood.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha o bairro.", variant: "destructive" });
      return;
    }
    if (!buyerData.city.trim()) {
      toast({ title: "Campo obrigatório", description: "Preencha a cidade.", variant: "destructive" });
      return;
    }
    if (!buyerData.state.trim()) {
      toast({ title: "Campo obrigatório", description: "Selecione o estado.", variant: "destructive" });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">1</div>
        <h2 className="font-display text-xl font-bold">Dados do comprador</h2>
      </div>

      {/* User info card */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{buyerData.fullName || "Seu nome"}</p>
          <p className="text-sm text-muted-foreground truncate">{buyerData.email || user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name + Email (read-only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium">Nome completo <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.fullName}
              onChange={(e) => setBuyerData((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">E-mail <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              value={buyerData.email}
              onChange={(e) => setBuyerData((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@exemplo.com"
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        {/* Birth date */}
        <div className="max-w-xs">
          <Label className="text-xs font-medium">Data de nascimento <span className="text-destructive">*</span></Label>
          <Input
            type="date"
            value={buyerData.birthDate}
            onChange={(e) => setBuyerData((p) => ({ ...p, birthDate: e.target.value }))}
          />
        </div>

        {/* CPF + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium">CPF <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.cpf}
              onChange={(e) => setBuyerData((p) => ({ ...p, cpf: formatCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Celular <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.phone}
              onChange={(e) => setBuyerData((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
        </div>

        {/* CEP */}
        <div className="max-w-xs relative">
          <Label className="text-xs font-medium">CEP <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Input
              value={buyerData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {loadingCep && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Street + Number + Complement */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px] gap-4">
          <div>
            <Label className="text-xs font-medium">Av./Rua <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.street}
              onChange={(e) => setBuyerData((p) => ({ ...p, street: e.target.value }))}
              placeholder="Nome da rua"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Número <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.addressNumber}
              onChange={(e) => setBuyerData((p) => ({ ...p, addressNumber: e.target.value }))}
              placeholder="123"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Compl.</Label>
            <Input
              value={buyerData.complement}
              onChange={(e) => setBuyerData((p) => ({ ...p, complement: e.target.value }))}
              placeholder="Apto, Bloco..."
            />
          </div>
        </div>

        {/* Neighborhood + City + State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-medium">Bairro <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.neighborhood}
              onChange={(e) => setBuyerData((p) => ({ ...p, neighborhood: e.target.value }))}
              placeholder="Bairro"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Cidade <span className="text-destructive">*</span></Label>
            <Input
              value={buyerData.city}
              onChange={(e) => setBuyerData((p) => ({ ...p, city: e.target.value }))}
              placeholder="Cidade"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Estado <span className="text-destructive">*</span></Label>
            <Select value={buyerData.state} onValueChange={(v) => setBuyerData((p) => ({ ...p, state: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleValidateAndNext}>
        Próximo
      </Button>
    </div>
  );
}
