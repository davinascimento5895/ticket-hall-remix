import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  QrCode,
  Camera,
  CameraOff,
  Copy,
  Share2,
  Printer,
  Download,
  Shield,
  Lock,
  ExternalLink,
  HelpCircle,
  Clock,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface VerificationResult {
  valid: boolean;
  revoked?: boolean;
  revokedReason?: string;
  revokedAt?: string;
  certificate?: {
    id: string;
    certificate_code: string;
    attendee_name: string;
    issued_at: string;
    revoked_at: string | null;
    revoked_reason: string | null;
    workload_hours: number | null;
    events: {
      title: string;
      start_date: string;
      venue_name?: string;
      producer_id: string;
    };
    templates?: {
      id: string;
      primary_color: string;
    };
  };
  error?: string;
}

// Utility functions for privacy protection (LGPD compliance)
const maskCertificateCode = (code: string): string => {
  if (!code || code.length < 8) return code;
  const parts = code.split("-");
  if (parts.length >= 3) {
    return `${parts[0]}-****-${parts[parts.length - 1]}`;
  }
  return `${code.slice(0, 4)}****${code.slice(-4)}`;
};

const formatParticipantName = (fullName: string): { firstName: string; lastNameInitial: string } => {
  if (!fullName) return { firstName: "", lastNameInitial: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastNameInitial: "" };
  }
  const firstName = parts[0];
  const lastNameInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return { firstName, lastNameInitial };
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Share utilities
const shareOptions = {
  twitter: (url: string, text: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  linkedin: (url: string, text: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  whatsapp: (url: string, text: string) =>
    `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
};

export default function VerificarCertificado() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [verificationTimestamp, setVerificationTimestamp] = useState<string | null>(null);
  
  // QR Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>("qr-verify-" + Math.random().toString(36).slice(2));
  const lastScannedRef = useRef<string>("");

  // Auto-verify if code is in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && !hasSearched) {
      verifyCertificate(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifyCertificate = async (certCode: string) => {
    if (!certCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código de verificação do certificado.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setHasSearched(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*, events(title, start_date, venue_name, producer_id), templates(id, primary_color)")
        .eq("certificate_code", certCode.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const isRevoked = !!data.revoked_at;
        setResult({
          valid: !isRevoked,
          revoked: isRevoked,
          revokedReason: data.revoked_reason,
          revokedAt: data.revoked_at,
          certificate: data as unknown as VerificationResult['certificate'],
        });
        setVerificationTimestamp(new Date().toISOString());
        // Update URL with code
        setSearchParams({ code: certCode.trim() });
      } else {
        setResult({
          valid: false,
          error: "Certificado não encontrado. Verifique o código e tente novamente.",
        });
      }
    } catch (error) {
      setResult({
        valid: false,
        error: "Erro ao verificar certificado. Tente novamente mais tarde.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCertificate(code);
  };

  // QR Scanner functions
  const startScanner = useCallback(async () => {
    const containerId = scannerContainerRef.current;
    if (scannerRef.current) return;
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (lastScannedRef.current === decodedText) return;
          lastScannedRef.current = decodedText;
          // Extract code from URL or use as-is
          const urlMatch = decodedText.match(/[?&]code=([^&]+)/);
          const extractedCode = urlMatch ? urlMatch[1] : decodedText;
          setCode(extractedCode);
          verifyCertificate(extractedCode);
          // Stop scanner after successful scan
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
              setScannerActive(false);
            }).catch(() => {});
          }
          setTimeout(() => { lastScannedRef.current = ""; }, 3000);
        },
        () => {}
      );
      setScannerActive(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Permissão de câmera negada. Verifique as configurações do seu navegador.";
      toast({ 
        title: "Erro ao abrir câmera", 
        description: errorMessage, 
        variant: "destructive" 
      });
      scannerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Share functions
  const handleCopyLink = () => {
    const url = `${window.location.origin}/verificar-certificado?code=${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link de verificação foi copiado para a área de transferência.",
    });
  };

  const handleShare = async (platform?: "twitter" | "linkedin" | "whatsapp") => {
    if (!result?.certificate) return;
    
    const { firstName, lastNameInitial } = formatParticipantName(result.certificate.attendee_name);
    const url = `${window.location.origin}/verificar-certificado?code=${result.certificate.certificate_code}`;
    const text = `Confira meu certificado de participação em ${result.certificate.events.title}!`;

    if (platform) {
      const shareUrl = shareOptions[platform](url, text);
      window.open(shareUrl, "_blank", "width=600,height=400");
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado - ${result.certificate.events.title}`,
          text,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF (only for authenticated users who own the certificate)
  const handleDownloadPDF = async () => {
    if (!result?.certificate) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ certificateId: result.certificate.id }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${result.certificate.certificate_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Certificado baixado!",
        description: "O PDF foi salvo em seus downloads.",
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Get SEO title and description based on result
  const getSEOMeta = () => {
    if (result?.valid && result.certificate) {
      const { firstName } = formatParticipantName(result.certificate.attendee_name);
      return {
        title: `Certificado Válido - ${result.certificate.events.title}`,
        description: `Certificado de participação verificado para ${firstName} no evento ${result.certificate.events.title}`,
      };
    }
    if (result?.revoked) {
      return {
        title: "Certificado Revogado",
        description: "Este certificado foi revogado e não é mais válido.",
      };
    }
    return {
      title: "Verificar Certificado",
      description: "Verifique a autenticidade de certificados de participação emitidos pela TicketHall.",
    };
  };

  const seoMeta = getSEOMeta();

  return (
    <>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        canonicalUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/verificar-certificado${code ? `?code=${code}` : ""}`}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .container { max-width: 100% !important; padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-primary/10 no-print">
        <div className="container pt-8 pb-12">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Verificação de Certificado</h1>
              <p className="text-muted-foreground">
                Valide a autenticidade de certificados emitidos pela TicketHall
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only text-center py-8 border-b">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Award className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl font-bold">TicketHall</span>
        </div>
        <h1 className="text-xl font-bold">Comprovante de Verificação</h1>
        <p className="text-sm text-gray-600">
          Emitido em {formatDateTime(new Date().toISOString())}
        </p>
      </div>

      <div className="container py-8 pb-16 max-w-2xl">
        {/* Search Section */}
        {!result && (
          <Card className="mb-8 no-print">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Buscar Certificado
              </CardTitle>
              <CardDescription>
                Digite o código de verificação ou escaneie o QR code do certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Scanner */}
              <div className="space-y-2">
                <div
                  id={scannerContainerRef.current}
                  className={`w-full rounded-lg overflow-hidden ${scannerActive ? "h-64" : "h-0"}`}
                  aria-label="Leitor de QR code"
                  role="region"
                />
                {!scannerActive && (
                  <div 
                    className="w-full h-40 bg-muted rounded-lg flex flex-col items-center justify-center gap-2 border border-dashed border-border"
                    aria-hidden="true"
                  >
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ative a câmera para escanear o QR code</p>
                  </div>
                )}
                <Button
                  type="button"
                  variant={scannerActive ? "destructive" : "outline"}
                  className="w-full"
                  onClick={scannerActive ? stopScanner : startScanner}
                  aria-label={scannerActive ? "Desligar câmera" : "Ligar câmera para escanear QR code"}
                >
                  {scannerActive ? (
                    <><CameraOff className="h-4 w-4 mr-2" /> Desligar Câmera</>
                  ) : (
                    <><Camera className="h-4 w-4 mr-2" /> Escanear QR Code</>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Manual Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-2">
                    Código de Verificação
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">O código está no canto inferior do certificado PDF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        placeholder="Ex: CERT-ABCD-12345678-XYZ"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="pl-9 font-mono uppercase"
                        disabled={isVerifying || scannerActive}
                        aria-label="Código de verificação do certificado"
                        autoComplete="off"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isVerifying || !code.trim() || scannerActive}
                      className="gap-2"
                      aria-label="Verificar certificado"
                    >
                      {isVerifying ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" role="status" aria-label="Verificando..." />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Verificar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: CERT-XXXX-XXXXXXXX-XXX (encontrado no certificado PDF)
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {isVerifying ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4" role="status" aria-label="Verificando certificado">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground">Verificando certificado...</p>
              </div>
            </CardContent>
          </Card>
        ) : result ? (
          <>
            {/* Valid Certificate */}
            {result.valid && result.certificate ? (
              <Card 
                className="border-green-500/20 bg-green-50/50 dark:bg-green-950/10 overflow-hidden"
                role="article"
                aria-label="Certificado válido"
              >
                {/* Header with gradient based on template color */}
                <div 
                  className="h-24 relative flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${result.certificate.templates?.primary_color || "#10b981"} 0%, ${result.certificate.templates?.primary_color || "#059669"}80 100%)` 
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <pattern id="cert-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                        <circle cx="10" cy="10" r="1" fill="white" />
                      </pattern>
                      <rect width="100" height="100" fill="url(#cert-pattern)" />
                    </svg>
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    {/* Status Badge */}
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 text-sm px-4 py-1.5 font-semibold">
                      <FileCheck className="h-4 w-4 mr-1.5" />
                      Certificado Válido
                    </Badge>

                    {/* Event Name */}
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Evento</p>
                      <h2 className="font-display font-bold text-xl text-foreground">
                        {result.certificate.events.title}
                      </h2>
                    </div>

                    {/* Certificate Details */}
                    <div className="w-full p-5 bg-background/80 rounded-xl border border-green-200/50 space-y-4">
                      {/* Participant - Privacy Protected */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-xs text-muted-foreground">Participante</p>
                          <p className="font-semibold text-lg">
                            {(() => {
                              const { firstName, lastNameInitial } = formatParticipantName(result.certificate!.attendee_name);
                              return `${firstName} ${lastNameInitial ? lastNameInitial + "." : ""}`;
                            })()}
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Lock className="h-3 w-3" />
                                  <span>Nome protegido por privacidade</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">De acordo com a LGPD, exibimos apenas o primeiro nome e inicial do sobrenome.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <Separator />

                      {/* Event Date */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Data do Evento</p>
                          <p className="font-medium">{formatDate(result.certificate.events.start_date)}</p>
                        </div>
                      </div>

                      {/* Workload Hours */}
                      {result.certificate.workload_hours && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">Carga Horária</p>
                            <p className="font-medium">{result.certificate.workload_hours} horas</p>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Certificate Code - Masked */}
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Código de Verificação</p>
                        <p className="font-mono text-lg font-semibold text-green-700 dark:text-green-400">
                          {maskCertificateCode(result.certificate.certificate_code)}
                        </p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                                <Lock className="h-3 w-3" />
                                <span>Código parcialmente oculto</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Por segurança, parte do código é oculta na verificação pública.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Issue Date */}
                      <p className="text-xs text-muted-foreground text-center">
                        Emitido em {formatDate(result.certificate.issued_at)}
                      </p>
                    </div>

                    {/* Verification Timestamp */}
                    {verificationTimestamp && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Verificado em {formatDateTime(verificationTimestamp)}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center no-print">
                      {user && (
                        <Button 
                          variant="default" 
                          className="gap-2"
                          onClick={handleDownloadPDF}
                        >
                          <Download className="h-4 w-4" />
                          Baixar PDF
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={handlePrint}
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleShare()}
                      >
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                      </Button>
                    </div>

                    {/* Social Share Buttons */}
                    <div className="flex gap-2 justify-center no-print">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => handleShare("twitter")}
                        aria-label="Compartilhar no Twitter"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => handleShare("linkedin")}
                        aria-label="Compartilhar no LinkedIn"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => handleShare("whatsapp")}
                        aria-label="Compartilhar no WhatsApp"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        onClick={handleCopyLink}
                        aria-label="Copiar link de verificação"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 px-4 py-2 rounded-full">
                      <Shield className="h-3.5 w-3.5 text-green-500" />
                      <span>Este certificado foi emitido e verificado pela plataforma TicketHall</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : result?.revoked && result.certificate ? (
              /* Revoked Certificate */
              <Card 
                className="border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/10 overflow-hidden"
                role="article"
                aria-label="Certificado revogado"
              >
                <div className="h-24 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <Badge variant="destructive" className="text-sm px-4 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                      <AlertTriangle className="h-4 w-4 mr-1.5" />
                      Certificado Revogado
                    </Badge>
                    
                    <div className="space-y-3 max-w-sm">
                      <p className="text-muted-foreground">
                        Este certificado foi revogado pelo organizador do evento e não possui mais validade.
                      </p>
                      {result.revokedReason && (
                        <div className="p-4 bg-orange-100/50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">Motivo da revogação:</p>
                          <p className="text-sm text-orange-700 dark:text-orange-300">{result.revokedReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full p-4 bg-background/80 rounded-lg border border-orange-200/50 space-y-2 text-left">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Evento:</span>{" "}
                        <span className="font-medium">{result.certificate.events.title}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Participante:</span>{" "}
                        <span className="font-medium">
                          {(() => {
                            const { firstName, lastNameInitial } = formatParticipantName(result.certificate!.attendee_name);
                            return `${firstName} ${lastNameInitial ? lastNameInitial + "." : ""}`;
                          })()}
                        </span>
                      </p>
                      {result.revokedAt && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Revogado em:</span>{" "}
                          <span className="font-medium">{formatDate(result.revokedAt)}</span>
                        </p>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCode("");
                        setResult(null);
                        setHasSearched(false);
                        setSearchParams({});
                      }}
                      className="gap-2 no-print"
                    >
                      <Search className="h-4 w-4" />
                      Verificar outro certificado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Not Found / Invalid Certificate */
              <Card 
                className="border-red-500/20 bg-red-50/50 dark:bg-red-950/10 overflow-hidden"
                role="article"
                aria-label="Certificado não encontrado"
              >
                <div className="h-24 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <Badge variant="destructive" className="text-sm px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Certificado Não Encontrado
                    </Badge>
                    
                    <div className="space-y-2 max-w-sm">
                      <p className="text-muted-foreground">
                        {result.error || "Não foi possível encontrar um certificado válido com o código informado."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Verifique se o código foi digitado corretamente ou entre em contato com o suporte.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center no-print">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setCode("");
                          setResult(null);
                          setHasSearched(false);
                          setSearchParams({});
                        }}
                        className="gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Tentar novamente
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="gap-2"
                        onClick={() => window.open("/faq", "_blank")}
                      >
                        <HelpCircle className="h-4 w-4" />
                        Ajuda
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground max-w-xs">
                      Se você acredita que isso é um erro, entre em contato com o organizador do evento ou com nosso{" "}
                      <a href="/faq" className="text-primary hover:underline">suporte</a>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Back to search button for results */}
            {result && (
              <div className="mt-6 text-center no-print">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setCode("");
                    setResult(null);
                    setHasSearched(false);
                    setSearchParams({});
                    stopScanner();
                  }}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Verificar outro certificado
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Initial State - Info Cards */
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Verificação Instantânea</p>
                <p className="text-xs text-muted-foreground">
                  Confirme a autenticidade de qualquer certificado em segundos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <QrCode className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Código Único</p>
                <p className="text-xs text-muted-foreground">
                  Cada certificado possui um código exclusivo de rastreamento
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Validade Oficial</p>
                <p className="text-xs text-muted-foreground">
                  Certificados emitidos apenas por produtores verificados
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-12 pt-8 border-t border-border/50 no-print">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Verificação Segura</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Este certificado foi emitido pela plataforma TicketHall. Todos os certificados são 
              verificados digitalmente e protegidos contra falsificação.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="/politica-de-privacidade" className="hover:text-primary transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Política de Privacidade
              </a>
              <span className="text-border">|</span>
              <a href="/termos-de-uso/cliente" className="hover:text-primary transition-colors flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Termos de Uso
              </a>
              <span className="text-border">|</span>
              <a href="/faq" className="hover:text-primary transition-colors flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Ajuda
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TicketHall. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
