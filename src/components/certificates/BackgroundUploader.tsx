/**
 * BackgroundUploader Component
 *
 * Upload button with file picker, always shows A4 landscape crop,
 * preview, and image quality warnings.
 */

import { useState, useCallback } from "react";
import { Upload, ImageIcon, Trash2, AlertTriangle, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CertificateImageCrop } from "./CertificateImageCrop";

export interface BackgroundUploaderProps {
  backgroundUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  compact?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

function validateImage(file: File): ImageValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Formato invalido. Use JPG ou PNG.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Arquivo muito grande. Maximo 5MB.",
    };
  }

  return { valid: true };
}

export function BackgroundUploader({
  backgroundUrl,
  onUpload,
  onRemove,
  compact = false,
}: BackgroundUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error || "Erro de validacao");
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowCropDialog(true);
    },
    []
  );

  const handleCropDone = useCallback(
    async (croppedFile: File) => {
      setIsUploading(true);
      try {
        const fileName = `certificate-bg-${Date.now()}-${croppedFile.name}`;
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(fileName, croppedFile, { upsert: true, contentType: croppedFile.type });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
        onUpload(publicUrlData.publicUrl);
        setShowCropDialog(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      } catch (err: any) {
        console.error("Upload error:", err);
        const message = err?.message || err?.error_description || "Erro desconhecido";
        if (message.toLowerCase().includes("bucket") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("não encontrado")) {
          setError("Bucket 'event-images' não encontrado no Supabase. Crie o bucket para fazer upload de imagens.");
        } else {
          setError(`Erro ao fazer upload: ${message}`);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, previewUrl]
  );

  const handleCropCancel = useCallback(() => {
    setShowCropDialog(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

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

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert className="py-2 border-orange-300/60 bg-orange-50/80 dark:bg-orange-950/20">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-xs flex items-center justify-between text-orange-800 dark:text-orange-200">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-orange-700/80 hover:text-orange-900 dark:text-orange-200/80 dark:hover:text-orange-100"
            >
              ×
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Area or Preview */}
      {backgroundUrl ? (
        <Card className="overflow-hidden">
          <div className="aspect-[297/210] bg-muted">
            <img
              src={backgroundUrl}
              alt="Background do certificado"
              className="w-full h-full object-cover"
            />
          </div>

          {compact ? (
            <div className="p-3 bg-muted/30 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Imagem de fundo ativa</span>
                </div>
                <div className="flex items-center gap-1 text-orange-600 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ativo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-1" />
                      Alterar
                    </span>
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={onRemove} className="w-full">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Imagem de fundo do certificado</span>
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <Check className="w-3.5 h-3.5" />
                <span>Ativo</span>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center w-full h-48",
            compact && "h-36",
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
              <span className="font-medium">Clique para enviar</span> ou arraste
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG até 5MB</p>
          </div>
        </label>
      )}

      {/* Quality Warning */}
      {compact ? (
        <p className="text-[11px] text-muted-foreground">JPG ou PNG, até 5MB.</p>
      ) : (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 py-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Recomendação:</strong> Use imagens com min. 300 DPI para impressão de qualidade. Resolução ideal: 3508 x 2480px (A4 paisagem).
          </AlertDescription>
        </Alert>
      )}

      {/* Crop Dialog */}
      {previewUrl && (
        <CertificateImageCrop
          open={showCropDialog}
          onOpenChange={(open) => {
            if (!open) handleCropCancel();
            else setShowCropDialog(open);
          }}
          imageSrc={previewUrl}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
}
