/**
 * BackgroundUploader Component
 * 
 * Upload button with file picker, A4 landscape validation,
 * crop interface, preview, and image quality warnings.
 */

import { useState, useCallback } from "react";
import {
  Upload,
  ImageIcon,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Crop,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface BackgroundUploaderProps {
  backgroundUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  eventId: string;
}

// A4 Landscape aspect ratio
const A4_ASPECT_RATIO = 297 / 210;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

interface ImageValidationResult {
  valid: boolean;
  error?: string;
  aspectRatio?: number;
}

function validateImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      resolve({
        valid: false,
        error: "Formato invalido. Use JPG ou PNG.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      resolve({
        valid: false,
        error: "Arquivo muito grande. Maximo 5MB.",
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      URL.revokeObjectURL(img.src);

      resolve({
        valid: true,
        aspectRatio,
      });
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: "Erro ao carregar imagem.",
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

export function BackgroundUploader({
  backgroundUrl,
  onUpload,
  onRemove,
}: BackgroundUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const validation = await validateImage(file);

      if (!validation.valid) {
        setError(validation.error || "Erro de validacao");
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPendingFile(file);

      if (
        validation.aspectRatio &&
        Math.abs(validation.aspectRatio - A4_ASPECT_RATIO) > 0.05
      ) {
        setShowCropDialog(true);
      } else {
        handleUpload(url, file);
      }
    },
    []
  );

  const handleUpload = useCallback(
    async (url: string, _file?: File) => {
      setIsUploading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onUpload(url);
        setShowCropDialog(false);
        setPreviewUrl(null);
        setPendingFile(null);
      } catch {
        setError("Erro ao fazer upload. Tente novamente.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleCancelCrop = () => {
    setShowCropDialog(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingFile(null);
  };

  const handleConfirmCrop = () => {
    if (previewUrl && pendingFile) {
      handleUpload(previewUrl, pendingFile);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-xs flex items-center justify-between">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-destructive-foreground/80 hover:text-destructive-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area or Preview */}
      {backgroundUrl ? (
        <Card className="p-0 overflow-hidden">
          <div className="relative">
            <div className="aspect-[1.414/1] bg-muted">
              <img
                src={backgroundUrl}
                alt="Background do certificado"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <Button variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    Alterar
                  </span>
                </Button>
              </label>
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Background personalizado</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-3.5 h-3.5" />
              <span>Ativo</span>
            </div>
          </div>
        </Card>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center w-full h-48",
            "border-2 border-dashed rounded-lg cursor-pointer",
            "transition-colors duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                isDragging ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "w-6 h-6",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <p className="mb-1 text-sm text-foreground">
              <span className="font-medium">Clique para upload</span> ou arraste
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ate 5MB
            </p>
          </div>
        </label>
      )}

      {/* Quality Warning */}
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 py-2">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
          <strong>Recomendacao:</strong> Use imagens com min. 300 DPI para
          impressao de qualidade. Resolucao ideal: 3508 x 2480px (A4 paisagem).
        </AlertDescription>
      </Alert>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Ajustar Imagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="py-2">
              <AlertDescription className="text-xs">
                A imagem selecionada nao possui proporcao A4 (297:210).
                Voce pode prosseguir ou selecionar outra imagem.
              </AlertDescription>
            </Alert>

            {previewUrl && (
              <div className="relative aspect-[1.414/1] bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-4 border-2 border-dashed border-primary/50 pointer-events-none rounded">
                  <span className="absolute -top-5 left-0 text-[10px] text-muted-foreground bg-background px-1">
                    Proporcao A4
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelCrop}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmCrop} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Usar Imagem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
