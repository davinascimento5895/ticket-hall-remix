import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop as CropIcon, RotateCcw } from "lucide-react";

const TARGET_W = 1600;
const TARGET_H = 838;
const ASPECT = TARGET_W / TARGET_H;

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropDone: (croppedFile: File) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropModal({ open, onOpenChange, imageSrc, onCropDone }: ImageCropModalProps) {
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
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, TARGET_W, TARGET_H);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "cover-cropped.jpg", { type: "image/jpeg" });
          onCropDone(file);
          onOpenChange(false);
        }
        setSaving(false);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-primary" />
            Ajustar imagem de capa
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste o recorte para garantir que a imagem fique perfeita no banner.
            Dimensão final: <span className="font-mono font-semibold text-foreground">{TARGET_W} × {TARGET_H}px</span> (proporção ~16:9)
          </p>
        </DialogHeader>

        <div className="relative rounded-lg overflow-hidden bg-muted/50 border border-border">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT}
            minWidth={100}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Recortar"
              onLoad={onImageLoad}
              className="max-h-[60vh] w-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Resetar recorte
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={saving} className="gap-2">
              <CropIcon className="h-4 w-4" />
              {saving ? "Processando..." : "Confirmar recorte"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
