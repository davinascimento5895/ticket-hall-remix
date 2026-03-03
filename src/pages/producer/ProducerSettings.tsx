import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhooksManager } from "@/components/producer/WebhooksManager";
import { TeamMembersManager } from "@/components/producer/TeamMembersManager";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function ProducerSettings() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    cpf: profile?.cpf || "",
  });

  const [bank, setBank] = useState({ pix_key: "", bank_name: "", agency: "", account: "" });

  const saveMutation = useMutation({
    mutationFn: () => updateProfile(user!.id, { full_name: form.full_name, phone: form.phone, cpf: form.cpf }),
    onSuccess: () => toast({ title: "Perfil atualizado!" }),
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="bank">Bancário</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle className="text-base">Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
              <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="pt-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados Bancários</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Chave PIX</Label><Input value={bank.pix_key} onChange={(e) => setBank((p) => ({ ...p, pix_key: e.target.value }))} placeholder="CPF, e-mail ou telefone" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Banco</Label><Input value={bank.bank_name} onChange={(e) => setBank((p) => ({ ...p, bank_name: e.target.value }))} /></div>
                <div><Label>Agência</Label><Input value={bank.agency} onChange={(e) => setBank((p) => ({ ...p, agency: e.target.value }))} /></div>
              </div>
              <div><Label>Conta</Label><Input value={bank.account} onChange={(e) => setBank((p) => ({ ...p, account: e.target.value }))} /></div>
              <p className="text-xs text-muted-foreground">BANK_PAYOUT_INTEGRATION_POINT — Os dados bancários serão utilizados para repasses após integração com gateway de pagamento.</p>
              <Button variant="outline" disabled>Salvar dados bancários (em breve)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="pt-4 max-w-2xl">
          <TeamMembersManager />
        </TabsContent>

        <TabsContent value="integrations" className="pt-4 max-w-2xl">
          <WebhooksManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
