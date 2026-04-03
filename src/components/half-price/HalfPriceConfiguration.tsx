import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Ticket, AlertCircle, Shield, Eye } from "lucide-react";

const DOCUMENT_TYPES = [
  { 
    value: "student_id", 
    label: "Carteirinha de Estudante",
    description: "Carteirinha nacional válida com foto"
  },
  { 
    value: "senior_id", 
    label: "Identidade de Idoso",
    description: "RG ou CNH com data de nascimento"
  },
  { 
    value: "disability_id", 
    label: "Cartão PcD",
    description: "Cartão de identificação da pessoa com deficiência"
  },
  { 
    value: "id_jovem", 
    label: "ID Jovem",
    description: "Identidade Jovem para jovens de baixa renda"
  },
];

interface HalfPriceConfigurationProps {
  eventId: string;
  initialConfig?: {
    half_price_enabled?: boolean;
    half_price_require_document?: boolean;
    half_price_accepted_documents?: string[];
    half_price_show_badge_checkin?: boolean;
  };
}

export function HalfPriceConfiguration({ eventId, initialConfig }: HalfPriceConfigurationProps) {
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState({
    half_price_enabled: initialConfig?.half_price_enabled ?? false,
    half_price_require_document: initialConfig?.half_price_require_document ?? true,
    half_price_accepted_documents: initialConfig?.half_price_accepted_documents ?? 
      ["student_id", "senior_id", "disability_id", "id_jovem"],
    half_price_show_badge_checkin: initialConfig?.half_price_show_badge_checkin ?? true,
  });

  // Update local state when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        half_price_enabled: initialConfig.half_price_enabled ?? false,
        half_price_require_document: initialConfig.half_price_require_document ?? true,
        half_price_accepted_documents: initialConfig.half_price_accepted_documents ?? 
          ["student_id", "senior_id", "disability_id", "id_jovem"],
        half_price_show_badge_checkin: initialConfig.half_price_show_badge_checkin ?? true,
      });
    }
  }, [initialConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({
          half_price_enabled: config.half_price_enabled,
          half_price_require_document: config.half_price_require_document,
          half_price_accepted_documents: config.half_price_accepted_documents,
          half_price_show_badge_checkin: config.half_price_show_badge_checkin,
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

  const toggleDocument = (docValue: string) => {
    setConfig(prev => {
      const current = prev.half_price_accepted_documents;
      const updated = current.includes(docValue)
        ? current.filter(d => d !== docValue)
        : [...current, docValue];
      
      return { ...prev, half_price_accepted_documents: updated };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Configurações de Meia-Entrada
        </CardTitle>
        <CardDescription>
          Configure como a meia-entrada funcionará para este evento, conforme a Lei 12.933/2013
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="half-price-enabled" className="text-base font-medium">
              Oferecer meia-entrada
            </Label>
            <p className="text-sm text-muted-foreground">
              Permitir venda de ingressos de meia-entrada para estudantes, idosos, PcD e jovens de baixa renda
            </p>
          </div>
          <Switch
            id="half-price-enabled"
            checked={config.half_price_enabled}
            onCheckedChange={(checked) => 
              setConfig(prev => ({ ...prev, half_price_enabled: checked }))
            }
          />
        </div>

        {config.half_price_enabled && (
          <div className="space-y-6">
            {/* Alerta legal */}
            <div className="flex items-start gap-3 p-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Conformidade legal</p>
                <p className="text-amber-600">
                  Conforme a Lei Federal nº 12.933/2013, o beneficiário deve apresentar documento 
                  comprobatório na entrada do evento. A não apresentação permite a cobrança da 
                  diferença do valor integral ou a recusa da entrada.
                </p>
              </div>
            </div>

            {/* Exigir documento */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-document" className="text-base font-medium">
                      Exigir documento comprobatório
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      O comprador deve informar o documento no checkout
                    </p>
                  </div>
                  <Switch
                    id="require-document"
                    checked={config.half_price_require_document}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, half_price_require_document: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Documentos aceitos */}
            {config.half_price_require_document && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Documentos aceitos</Label>
                <p className="text-sm text-muted-foreground">
                  Selecione quais documentos serão aceitos para comprovação da meia-entrada
                </p>
                
                <div className="space-y-3">
                  {DOCUMENT_TYPES.map((doc) => (
                    <div 
                      key={doc.value}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`doc-${doc.value}`}
                        checked={config.half_price_accepted_documents.includes(doc.value)}
                        onCheckedChange={() => toggleDocument(doc.value)}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`doc-${doc.value}`}
                          className="font-medium cursor-pointer"
                        >
                          {doc.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {config.half_price_accepted_documents.length === 0 && (
                  <p className="text-sm text-destructive">
                    Selecione pelo menos um tipo de documento
                  </p>
                )}
              </div>
            )}

            {/* Indicador no check-in */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-badge" className="text-base font-medium">
                      Mostrar indicador no check-in
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Os operadores de check-in verão um indicador visual para ingressos de meia-entrada
                    </p>
                  </div>
                  <Switch
                    id="show-badge"
                    checked={config.half_price_show_badge_checkin}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, half_price_show_badge_checkin: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-3">Pré-visualização no checkout</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Meia-entrada:</strong> {config.half_price_enabled ? "Ativada" : "Desativada"}
                </p>
                {config.half_price_enabled && (
                  <>
                    <p className="text-muted-foreground">
                      <strong>Documento obrigatório:</strong> {config.half_price_require_document ? "Sim" : "Não"}
                    </p>
                    {config.half_price_require_document && (
                      <p className="text-muted-foreground">
                        <strong>Documentos aceitos:</strong>{" "}
                        {config.half_price_accepted_documents
                          .map(v => DOCUMENT_TYPES.find(d => d.value === v)?.label)
                          .join(", ")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || 
              (config.half_price_enabled && 
               config.half_price_require_document && 
               config.half_price_accepted_documents.length === 0)}
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
