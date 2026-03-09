import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast({ title: "Configurações salvas!" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações da Plataforma</h1>

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
          <Button onClick={handleSave}>Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Eventos em Destaque</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gerencie os eventos em destaque na página "Todos os Eventos" usando o ícone de estrela.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Taxa por Evento</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">A taxa da plataforma é configurada individualmente em cada evento. Acesse <strong>Eventos</strong> no menu lateral para alterar a taxa de um evento específico.</p>
          <p className="text-xs text-muted-foreground mt-2">Taxa padrão: 7% · Eventos gratuitos não possuem taxa.</p>
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
