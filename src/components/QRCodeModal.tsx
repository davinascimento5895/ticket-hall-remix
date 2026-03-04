import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  qrCode: string;
  qrCodeImageUrl?: string | null;
  eventTitle: string;
  tierName: string;
  attendeeName?: string;
}

export function QRCodeModal({
  open,
  onOpenChange,
  ticketId,
  qrCode,
  qrCodeImageUrl,
  eventTitle,
  tierName,
  attendeeName,
}: QRCodeModalProps) {
  const imageUrl = qrCodeImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ingresso-${ticketId.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Seu Ingresso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="mx-auto w-48 h-48 bg-white rounded-lg flex items-center justify-center p-2">
            <img
              src={imageUrl}
              alt="QR Code do ingresso"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display font-semibold text-foreground">{eventTitle}</p>
            <p className="text-sm text-muted-foreground">{tierName}</p>
            {attendeeName && (
              <p className="text-sm text-muted-foreground">{attendeeName}</p>
            )}
            <p className="text-xs text-muted-foreground font-mono">#{ticketId.slice(0, 8)}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Baixar ingresso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
