import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidQrCode } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TicketQRCodeProps {
  ticketId: string;
  qrCode: string | null | undefined;
  qrCodeImageUrl?: string | null;
  className?: string;
  size?: number;
}

export function TicketQRCode({
  ticketId,
  qrCode,
  qrCodeImageUrl,
  className = "",
  size = 112,
}: TicketQRCodeProps) {
  const { t } = useTranslation();
  const [currentQr, setCurrentQr] = useState(qrCode);
  const [currentImageUrl, setCurrentImageUrl] = useState(qrCodeImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const isValid = isValidQrCode(currentQr);

  const generateQr = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "generate-qr-code",
        { body: { ticketId } }
      );
      if (invokeErr) throw invokeErr;
      if (data?.success && data.qrCode) {
        setCurrentQr(data.qrCode);
        setCurrentImageUrl(data.imageUrl || null);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      console.error(t('errors.qrGenerationFailed'), e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If the passed qrCode becomes valid later, update local state
    if (isValidQrCode(qrCode)) {
      setCurrentQr(qrCode);
      setCurrentImageUrl(qrCodeImageUrl);
      setError(false);
    }
  }, [qrCode, qrCodeImageUrl]);

  useEffect(() => {
    // Auto-generate on mount if QR is missing or invalid
    if (!isValidQrCode(qrCode) && !loading && !error) {
      generateQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const imageUrl =
    currentImageUrl ||
    (isValidQrCode(currentQr)
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          currentQr
        )}`
      : null);

  if (loading) {
    return (
      <div
        className={`bg-muted rounded-lg border border-border flex flex-col items-center justify-center gap-2 ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground text-center px-1">
          Gerando QR...
        </span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`bg-destructive/10 rounded-lg border border-destructive/30 flex flex-col items-center justify-center gap-1 p-1 ${className}`}
        style={{ width: size, height: size }}
      >
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-[9px] text-destructive text-center leading-tight">
          QR indisponível
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-0 px-1 text-[9px] text-destructive underline"
          onClick={generateQr}
        >
          Tentar
        </Button>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={t('tickets.qrCodeLabel')}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      crossOrigin="anonymous"
    />
  );
}
