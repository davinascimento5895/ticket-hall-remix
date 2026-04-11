/**
 * SignersManager Component
 * 
 * List of signers with drag-and-drop reordering, add/remove functionality,
 * and signature image upload. Maximum 4 signers.
 */

import { useState, useCallback } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  Upload,
  User,
  Briefcase,
  Signature,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface Signer {
  id: string;
  name: string;
  role: string;
  signatureUrl?: string;
}

export interface SignersManagerProps {
  signers: Signer[];
  onChange: (signers: Signer[]) => void;
  eventId: string;
}

const MAX_SIGNERS = 4;

interface SignerCardProps {
  signer: Signer;
  index: number;
  isDragging: boolean;
  onUpdate: (id: string, updates: Partial<Signer>) => void;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  canRemove: boolean;
}

function SignerCard({
  signer,
  index,
  isDragging,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  canRemove,
}: SignerCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload - in real implementation, upload to storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onUpdate(signer.id, { signatureUrl: url });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onUpdate(signer.id, { signatureUrl: undefined });
  };

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "p-4 transition-all",
        isDragging && "opacity-50 border-dashed border-2 border-primary",
        "cursor-move hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="pt-2 text-muted-foreground">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Signer Number */}
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0 mt-1">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Name Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor={`signer-name-${signer.id}`}
              className="text-xs font-medium flex items-center gap-1.5"
            >
              <User className="w-3 h-3" />
              Nome
            </Label>
            <Input
              id={`signer-name-${signer.id}`}
              value={signer.name}
              onChange={(e) => onUpdate(signer.id, { name: e.target.value })}
              placeholder="Ex: João Silva"
              className="h-9 text-sm"
            />
          </div>

          {/* Role Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor={`signer-role-${signer.id}`}
              className="text-xs font-medium flex items-center gap-1.5"
            >
              <Briefcase className="w-3 h-3" />
              Cargo
            </Label>
            <Input
              id={`signer-role-${signer.id}`}
              value={signer.role}
              onChange={(e) => onUpdate(signer.id, { role: e.target.value })}
              placeholder="Ex: Diretor Executivo"
              className="h-9 text-sm"
            />
          </div>

          {/* Signature Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Signature className="w-3 h-3" />
              Assinatura (opcional)
            </Label>
            {signer.signatureUrl ? (
              <div className="relative group">
                <div className="h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  <img
                    src={signer.signatureUrl}
                    alt={`Assinatura de ${signer.name}`}
                    className="max-h-12 object-contain"
                  />
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">Upload assinatura</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  PNG, JPG até 2MB
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Remove Button */}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(signer.id)}
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export function SignersManager({
  signers,
  onChange,
}: SignersManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const canAddMore = signers.length < MAX_SIGNERS;
  const canRemove = signers.length > 1;

  const handleAddSigner = useCallback(() => {
    if (!canAddMore) return;

    const newSigner: Signer = {
      id: crypto.randomUUID(),
      name: "",
      role: "",
    };
    onChange([...signers, newSigner]);
  }, [signers, onChange, canAddMore]);

  const handleRemoveSigner = useCallback(
    (id: string) => {
      if (!canRemove) return;
      onChange(signers.filter((s) => s.id !== id));
    },
    [signers, onChange, canRemove]
  );

  const handleUpdateSigner = useCallback(
    (id: string, updates: Partial<Signer>) => {
      onChange(
        signers.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    [signers, onChange]
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newSigners = [...signers];
      const [movedItem] = newSigners.splice(draggedIndex, 1);
      newSigners.splice(dragOverIndex, 0, movedItem);
      onChange(newSigners);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">Assinantes</h4>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar • Máximo {MAX_SIGNERS}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAddSigner}
          disabled={!canAddMore}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Max Signers Warning */}
      {!canAddMore && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-xs">
            Limite máximo de {MAX_SIGNERS} assinantes atingido.
          </AlertDescription>
        </Alert>
      )}

      {/* Signers List */}
      <div className="space-y-3">
        {signers.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum assinante adicionado
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSigner}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar primeiro assinante
            </Button>
          </Card>
        ) : (
          signers.map((signer, index) => (
            <SignerCard
              key={signer.id}
              signer={signer}
              index={index}
              isDragging={draggedIndex === index}
              onUpdate={handleUpdateSigner}
              onRemove={handleRemoveSigner}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              canRemove={canRemove}
            />
          ))
        )}
      </div>

      {/* Signer Count */}
      {signers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {signers.length} de {MAX_SIGNERS} assinantes
          </span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_SIGNERS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  i < signers.length ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
