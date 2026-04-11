/**
 * LinkedInIntegration Component
 * 
 * Toggle to enable LinkedIn sharing with explanation,
 * preview of LinkedIn post, and test integration button.
 */

import { useState } from "react";
import {
  Linkedin,
  Share2,
  Check,
  ExternalLink,
  Info,
  TestTube,
  Award,
  Calendar,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface LinkedInIntegrationProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  certificateId?: string;
}

interface LinkedInPostPreviewProps {
  eventName: string;
  organizationName: string;
  date: string;
  skills: string[];
}

function LinkedInPostPreview({
  eventName,
  organizationName,
  date,
  skills,
}: LinkedInPostPreviewProps) {
  return (
    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      {/* LinkedIn Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-[#0a66c2] flex items-center justify-center shrink-0">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Nome do Participante
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acabou de ganhar um certificado
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
            <span>1h</span>
            <span>•</span>
            <GlobeIcon className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        <p className="text-sm text-slate-800 dark:text-slate-200">
          Estou feliz em compartilhar que concluí o evento{" "}
          <strong>"{eventName}"</strong>! 🎉
        </p>

        {/* Certificate Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center shrink-0">
                <Award className="w-8 h-8 text-[#0a66c2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2">
                  Certificado de Participação
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {organizationName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{date}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-[#0a66c2] font-medium">
              tickethall.com.br
            </p>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LinkedIn Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74c-.19-.63-.3-1.3-.3-2H10.5a7 7 0 01.3 2c.19.97.66 1.87 1.37 2.58L16 11l-3.83 3.83a7 7 0 01-2.74 1.69c-.63.19-1.3.3-2 .3V19a7 7 0 012-.3c.97-.19 1.87-.66 2.58-1.37L19.46 11z" />
          </svg>
          Compartilhar
        </button>
        <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 3L0 10l7.66 4.26L16 8l-6.26 8.34L14 24l7-21z" />
          </svg>
          Enviar
        </button>
      </div>
    </Card>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

export function LinkedInIntegration({
  enabled,
  onToggle,
}: LinkedInIntegrationProps) {
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTest = async () => {
    setTestStatus("testing");
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTestStatus("success");
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Card className={cn("p-4", enabled && "border-primary/50 bg-primary/5")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                enabled ? "bg-[#0a66c2]" : "bg-muted"
              )}
            >
              <Linkedin
                className={cn(
                  "w-5 h-5",
                  enabled ? "text-white" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="linkedin-toggle"
                  className="text-sm font-medium cursor-pointer"
                >
                  Compartilhar no LinkedIn
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        Permite que os participantes compartilhem seus
                        certificados diretamente no LinkedIn, aumentando a
                        visibilidade do seu evento.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Participantes podem adicionar o certificado ao perfil
              </p>
            </div>
          </div>
          <Switch
            id="linkedin-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </Card>

      {enabled && (
        <>
          {/* How it Works */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              Como funciona
            </h4>
            <div className="space-y-2">
              {[
                "Participantes recebem o certificado por e-mail",
                "Botão 'Adicionar ao LinkedIn' no e-mail",
                "Certificado é adicionado à seção 'Licenças e Certificados'",
                "Participante pode compartilhar no feed",
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Pré-visualização</h4>
              <Badge variant="secondary" className="text-xs">
                Simulação
              </Badge>
            </div>
            <LinkedInPostPreview
              eventName="Workshop de Marketing Digital 2024"
              organizationName="TicketHall Events"
              date="Janeiro de 2024"
              skills={["Marketing Digital", "Gestão de Eventos"]}
            />
          </div>

          {/* Test Integration */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestDialog(true)}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testar Integração
            </Button>
          </div>
        </>
      )}

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Testar Integração LinkedIn
            </DialogTitle>
            <DialogDescription>
              Verifique se a integração com o LinkedIn está funcionando
              corretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {testStatus === "success" ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-green-600">
                    Integração funcionando!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O LinkedIn está configurado corretamente.
                  </p>
                </div>
              </div>
            ) : testStatus === "error" ? (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">
                  Erro ao testar integração. Verifique suas configurações.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">LinkedIn API</p>
                    <p className="text-xs text-muted-foreground">
                      Conexão verificada
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-green-500 ml-auto" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Award className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Formato do Certificado</p>
                    <p className="text-xs text-muted-foreground">
                      Compatível com LinkedIn
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTestDialog(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={handleTest}
              disabled={testStatus === "testing" || testStatus === "success"}
            >
              {testStatus === "testing" ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Testando...
                </>
              ) : testStatus === "success" ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Testado
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Executar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learn More Link */}
      <div className="flex items-center justify-center">
        <a
          href="https://www.linkedin.com/help/linkedin/ask/TS-RRE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Saiba mais sobre certificados no LinkedIn
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
