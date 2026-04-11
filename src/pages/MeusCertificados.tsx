import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Award, Download, FileCheck, Share2, ExternalLink, QrCode, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyCertificates } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Certificate {
  id: string;
  certificate_code: string;
  attendee_name: string;
  issued_at: string;
  created_at: string;
  download_url?: string;
  events?: {
    title: string;
    start_date: string;
    venue_name?: string;
  };
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
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
          body: JSON.stringify({ certificateId: cert.id }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${cert.certificate_code}.pdf`;
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
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verificar-certificado?code=${cert.certificate_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado - ${cert.events?.title}`,
          text: `Confira meu certificado de participação em ${cert.events?.title}!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link de verificação foi copiado para a área de transferência.",
      });
    }
  };

  const eventDate = cert.events?.start_date 
    ? new Date(cert.events.start_date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
        <CardContent className="p-0">
          {/* Certificate Header with gradient */}
          <div className="relative h-24 bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id={`pattern-${cert.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
                  <circle cx="10" cy="10" r="1" fill="currentColor" className="text-white" />
                </pattern>
                <rect width="100" height="100" fill={`url(#pattern-${cert.id})`} />
              </svg>
            </div>
            <Award className="h-12 w-12 text-white/90 relative z-10" />
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 bg-white/20 text-white border-0 backdrop-blur-sm"
            >
              <FileCheck className="h-3 w-3 mr-1" />
              Válido
            </Badge>
          </div>

          {/* Certificate Content */}
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 leading-tight">
                {cert.events?.title || "Evento"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {cert.attendee_name}
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              {eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{eventDate}</span>
                </div>
              )}
              {cert.events?.venue_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{cert.events.venue_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <QrCode className="h-3.5 w-3.5" />
                <span className="font-mono">{cert.certificate_code}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Baixar PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleShare}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowDetails(true)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Detalhes do Certificado
            </DialogTitle>
            <DialogDescription>
              Informações de verificação do certificado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Evento</p>
                <p className="font-medium">{cert.events?.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Participante</p>
                <p className="font-medium">{cert.attendee_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Código de Verificação</p>
                <p className="font-mono text-sm bg-background px-2 py-1 rounded border inline-block">
                  {cert.certificate_code}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Emitido em</p>
                <p className="text-sm">
                  {new Date(cert.issued_at || cert.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => {
                  setShowDetails(false);
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Certificado
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Verifique a autenticidade em:{" "}
              <a 
                href={`/verificar-certificado?code=${cert.certificate_code}`}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                tickethall.com/verificar-certificado
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MeusCertificados() {
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["my-certificates", user?.id],
    queryFn: () => getMyCertificates(user!.id),
    enabled: !!user?.id,
  });

  return (
    <>
      <SEOHead title="Meus Certificados" description="Seus certificados de eventos na TicketHall." />
      
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-primary/10">
        <div className="container pt-8 pb-12">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Meus Certificados</h1>
              <p className="text-muted-foreground">
                Certificados de participação dos eventos que você participou
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <div className="h-24 bg-muted animate-pulse" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !certificates || certificates.length === 0 ? (
          <div className="max-w-md mx-auto">
            <EmptyState
              icon={<Award className="h-12 w-12" />}
              title="Nenhum certificado ainda"
              description="Certificados de participação aparecerão aqui após o check-in em eventos que emitem certificados."
              action={{
                label: "Ver eventos disponíveis",
                href: "/eventos",
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {certificates.length} {certificates.length === 1 ? "certificado" : "certificados"} disponível
                {certificates.length === 1 ? "" : "is"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert: Certificate) => (
                <CertificateCard key={cert.id} cert={cert} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
