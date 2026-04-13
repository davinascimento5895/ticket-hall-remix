import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Crop as CropIcon, RotateCcw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// A4 Landscape aspect ratio
const A4_ASPECT = 297 / 210;
// High-res target for print quality (300 DPI A4 landscape)
const TARGET_W = 3508;
const TARGET_H = 2480;

interface CertificateImageCropProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropDone: (croppedFile: File) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, A4_ASPECT, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function CertificateImageCrop({ open, onOpenChange, imageSrc, onCropDone }: CertificateImageCropProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const c = centerAspectCrop(naturalWidth, naturalHeight);
    setCrop(c);
    setCompletedCrop(c);
  }, []);

  const handleReset = () => {
    if (imgRef.current) {
      const c = centerAspectCrop(imgRef.current.naturalWidth, imgRef.current.naturalHeight);
      setCrop(c);
      setCompletedCrop(c);
    }
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.x ?? 0) * scaleX,
      y: (completedCrop.y ?? 0) * scaleY,
      width: (completedCrop.width ?? 0) * scaleX,
      height: (completedCrop.height ?? 0) * scaleY,
    };

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      TARGET_W,
      TARGET_H
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "certificate-background.png", { type: "image/png" });
          onCropDone(file);
          onOpenChange(false);
        } else {
          // eslint-disable-next-line no-console
          console.error("Canvas toBlob returned null");
        }
        setSaving(false);
      },
      "image/png",
      1.0
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[92vh] p-0 gap-0 overflow-hidden"
        style={{
          // Override default centered positioning that pushes content off-screen
          top: "1rem",
          transform: "translate(-50%, 0)",
        }}
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-primary" />
            Ajustar imagem do certificado
          </DialogTitle>
          <DialogDescription>
            Selecione a área da imagem que será usada como fundo do certificado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          <Alert className="py-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              A proporção está fixada em <strong>A4 paisagem (297:210)</strong> e não pode ser alterada.
            </AlertDescription>
          </Alert>

          <div className="relative rounded-lg overflow-hidden bg-muted/50 border border-border flex justify-center items-start">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={A4_ASPECT}
              minWidth={100}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Recortar certificado"
                onLoad={onImageLoad}
                className="max-h-[32vh] sm:max-h-[40vh] md:max-h-[45vh] w-auto max-w-full object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Resetar recorte
          </Button>
          <div className="flex gap-2 ml-auto w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1 sm:flex-initial">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={saving} className="gap-2 flex-1 sm:flex-initial">
              <CropIcon className="h-4 w-4" />
              {saving ? "Processando..." : "Confirmar recorte"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
