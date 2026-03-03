import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [platformFee, setPlatformFee] = useState(7);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    // Settings would be persisted to a config table or env
    toast({ title: "Configurações salvas!" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações da Plataforma</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Taxa da Plataforma</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Taxa padrão (%)</Label>
            <Input type="number" min={0} max={100} step={0.1} value={platformFee} onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground mt-1">Taxa cobrada sobre cada ingresso vendido. Padrão: 7%</p>
          </div>
          <Button onClick={handleSave}>Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Modo Manutenção</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            <div>
              <Label>Ativar modo manutenção</Label>
              <p className="text-xs text-muted-foreground">Quando ativado, o site exibirá uma página de manutenção para todos os usuários.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Eventos em Destaque</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gerencie os eventos em destaque na página "Todos os Eventos" usando o ícone de estrela.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Templates de E-mail</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">EMAIL_TEMPLATE_INTEGRATION_POINT — Configuração de templates de e-mail será implementada em versão futura.</p>
        </CardContent>
      </Card>
    </div>
  );
}
