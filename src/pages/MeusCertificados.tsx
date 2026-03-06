import { useQuery } from "@tanstack/react-query";
import { Award, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function MeusCertificados() {
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["my-certificates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*, events(title, start_date, venue_name)")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <>
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
                        // Generate a simple text-based certificate download
                        const text = `CERTIFICADO DE PARTICIPAÇÃO\n\nCertificamos que ${cert.attendee_name} participou do evento "${cert.events?.title}".\n\nData: ${new Date(cert.events?.start_date).toLocaleDateString("pt-BR")}\nCódigo: ${cert.certificate_code}\n\nEmitido em: ${new Date(cert.issued_at).toLocaleDateString("pt-BR")}`;
                        const blob = new Blob([text], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `certificado-${cert.certificate_code}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
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
