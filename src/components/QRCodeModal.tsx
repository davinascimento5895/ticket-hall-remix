import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  qrCode: string;
  eventTitle: string;
  tierName: string;
  attendeeName?: string;
}

export function QRCodeModal({
  open,
  onOpenChange,
  ticketId,
  qrCode,
  eventTitle,
  tierName,
  attendeeName,
}: QRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Seu Ingresso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="mx-auto w-48 h-48 bg-white rounded-lg flex items-center justify-center p-4">
            {/* QR_CODE_INTEGRATION_POINT — replace with real QR generation */}
            <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground font-mono break-all p-2">
              {qrCode}
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-display font-semibold text-foreground">{eventTitle}</p>
            <p className="text-sm text-muted-foreground">{tierName}</p>
            {attendeeName && (
              <p className="text-sm text-muted-foreground">{attendeeName}</p>
            )}
            <p className="text-xs text-muted-foreground font-mono">#{ticketId.slice(0, 8)}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Baixar ingresso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
