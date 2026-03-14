import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Award, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { getMyCertificates } from "@/lib/api";

function generateCertificatePdf(cert: any) {
  import("jspdf").then(({ default: jsPDF }) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(2);
    doc.rect(10, 10, w - 20, h - 20);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, w - 28, h - 28);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(234, 88, 12);
    doc.text("CERTIFICADO DE PARTICIPAÇÃO", w / 2, 45, { align: "center" });

    // Decorative line
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.8);
    doc.line(w / 2 - 60, 52, w / 2 + 60, 52);

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Certificamos que", w / 2, 72, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(cert.attendee_name || "Participante", w / 2, 85, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("participou do evento", w / 2, 100, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const eventTitle = cert.events?.title || "Evento";
    doc.text(eventTitle, w / 2, 113, { align: "center", maxWidth: w - 60 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const eventDate = new Date(cert.events?.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`realizado em ${eventDate}`, w / 2, 128, { align: "center" });

    // Code
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Código de verificação: ${cert.certificate_code}`, w / 2, 155, { align: "center" });

    // Issue date
    const issuedDate = new Date(cert.issued_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`Emitido em ${issuedDate}`, w / 2, 162, { align: "center" });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text("TicketHall — tickethall.com.br", w / 2, h - 18, { align: "center" });

    doc.save(`certificado-${cert.certificate_code}.pdf`);
  });
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
      <div className="container pt-24 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Meus Certificados</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !certificates || certificates.length === 0 ? (
          <EmptyState
            icon={<Award className="h-12 w-12" />}
            title="Nenhum certificado"
            description="Certificados de participação aparecerão aqui após o check-in em eventos que emitem certificados."
          />
        ) : (
          <div className="space-y-4">
            {certificates.map((cert: any) => (
              <Card key={cert.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">
                      {cert.events?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {cert.attendee_name} · {new Date(cert.events?.start_date).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {cert.certificate_code}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      if (cert.download_url) {
                        window.open(cert.download_url, "_blank");
                      } else {
                        generateCertificatePdf(cert);
                      }
                    }}
                  >
                    <Download className="h-4 w-4" /> Baixar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
