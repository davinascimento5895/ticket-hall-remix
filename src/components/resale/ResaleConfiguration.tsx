import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Store, AlertCircle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ResaleConfigurationProps {
  eventId: string;
  initialConfig?: {
    allow_resale?: boolean;
    resale_min_price_percent?: number;
    resale_max_price_percent?: number;
    resale_start_date?: string;
    resale_end_date?: string;
  };
}

export function ResaleConfiguration({ eventId, initialConfig }: ResaleConfigurationProps) {
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState({
    allow_resale: initialConfig?.allow_resale ?? true,
    resale_min_price_percent: initialConfig?.resale_min_price_percent ?? 50,
    resale_max_price_percent: initialConfig?.resale_max_price_percent ?? 150,
    resale_start_date: initialConfig?.resale_start_date 
      ? new Date(initialConfig.resale_start_date).toISOString().slice(0, 16)
      : "",
    resale_end_date: initialConfig?.resale_end_date
      ? new Date(initialConfig.resale_end_date).toISOString().slice(0, 16)
      : "",
  });

  // Update local state when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        allow_resale: initialConfig.allow_resale ?? true,
        resale_min_price_percent: initialConfig.resale_min_price_percent ?? 50,
        resale_max_price_percent: initialConfig.resale_max_price_percent ?? 150,
        resale_start_date: initialConfig.resale_start_date
          ? new Date(initialConfig.resale_start_date).toISOString().slice(0, 16)
          : "",
        resale_end_date: initialConfig.resale_end_date
          ? new Date(initialConfig.resale_end_date).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [initialConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({
          allow_resale: config.allow_resale,
          resale_min_price_percent: config.resale_min_price_percent,
          resale_max_price_percent: config.resale_max_price_percent,
          resale_start_date: config.resale_start_date || null,
          resale_end_date: config.resale_end_date || null,
        })
        .eq("id", eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-event-panel", eventId] });
      toast({ title: "Configurações salvas" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao salvar", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const minPriceRange = config.resale_min_price_percent;
  const maxPriceRange = config.resale_max_price_percent;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Configurações de Revenda
            </CardTitle>
            <CardDescription>
              Defina como os compradores podem revender ingressos deste evento
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Ver Termos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Termos de Revenda</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong>Revenda de Ingressos</strong>
                </p>
                <p>
                  A revenda só funciona quando o evento habilita esse recurso. Quando habilitada, a operação acontece apenas pelo fluxo oficial da TicketHall e pode seguir limites de preço, prazo, taxa e elegibilidade definidos para o evento.
                </p>
                <p>
                  Ingressos comprados fora da plataforma, em mercado paralelo ou por canal não autorizado ficam por conta e risco do usuário. A TicketHall não garante autenticidade nem validade nessas hipóteses.
                </p>
                <p>
                  Quando a revenda oficial é concluída, o ingresso original pode ser invalidado e um novo código pode ser emitido ao comprador final.
                </p>
                <p>
                  Veja o texto completo da política de revenda no termo do cliente final.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/termos-de-uso/cliente#revenda">Abrir termo do cliente final</Link>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="allow-resale" className="text-base font-medium">
              Permitir revenda de ingressos
            </Label>
            <p className="text-sm text-muted-foreground">
              Os compradores poderão anunciar e vender seus ingressos na plataforma
            </p>
          </div>
          <Switch
            id="allow-resale"
            checked={config.allow_resale}
            onCheckedChange={(checked) => 
              setConfig(prev => ({ ...prev, allow_resale: checked }))
            }
          />
        </div>

        {config.allow_resale && (
          <div className="space-y-6">
            {/* Alerta informativo */}
            <div className="flex items-start gap-3 p-3 text-sm text-blue-600 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>
                Quando um ingresso é revendido, o vendedor recebe o valor em sua carteira digital 
                (com desconto de 10% de taxa). O comprador recebe um novo ingresso com QR Code único.
              </p>
            </div>

            {/* Limites de preço */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Limites de preço</h4>
              
              {/* Preço mínimo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Preço mínimo de revenda</Label>
                  <span className="text-sm font-medium">{minPriceRange}% do valor original</span>
                </div>
                <Slider
                  value={[minPriceRange]}
                  onValueChange={([value]) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      resale_min_price_percent: value,
                      // Garantir que min <= max
                      resale_max_price_percent: Math.max(value + 10, prev.resale_max_price_percent)
                    }))
                  }
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Ingresso de R$ 100,00 não pode ser revendido por menos de R$ {100 * minPriceRange / 100},00
                </p>
              </div>

              {/* Preço máximo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Preço máximo de revenda</Label>
                  <span className="text-sm font-medium">{maxPriceRange}% do valor original</span>
                </div>
                <Slider
                  value={[maxPriceRange]}
                  onValueChange={([value]) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      resale_max_price_percent: value 
                    }))
                  }
                  min={minPriceRange + 10}
                  max={300}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Ingresso de R$ 100,00 não pode ser revendido por mais de R$ {100 * maxPriceRange / 100},00
                </p>
              </div>
            </div>

            {/* Período de revenda */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Período de revenda</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início da revenda</Label>
                  <Input
                    type="datetime-local"
                    value={config.resale_start_date}
                    onChange={(e) => 
                      setConfig(prev => ({ 
                        ...prev, 
                        resale_start_date: e.target.value 
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para permitir imediatamente
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Término da revenda</Label>
                  <Input
                    type="datetime-local"
                    value={config.resale_end_date}
                    onChange={(e) => 
                      setConfig(prev => ({ 
                        ...prev, 
                        resale_end_date: e.target.value 
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para permitir até o início do evento
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
