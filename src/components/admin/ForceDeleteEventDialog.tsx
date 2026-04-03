import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const CONFIRM_TEXT = "REMOVER EVENTO";
const HOLD_DURATION_MS = 5000;

interface ForceDeleteEventDialogProps {
  eventTitle: string;
  onConfirm: () => Promise<void> | void;
  triggerLabel?: string;
}

export function ForceDeleteEventDialog({ eventTitle, onConfirm, triggerLabel = "Remover" }: ForceDeleteEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const inputId = `force-delete-${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const clearTimers = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    holdStartRef.current = null;
  };

  const resetHold = () => {
    clearTimers();
    setIsHolding(false);
    setHoldProgress(0);
  };

  const resetDialog = () => {
    clearTimers();
    setConfirmText("");
    setIsHolding(false);
    setHoldProgress(0);
    setIsSubmitting(false);
  };

  useEffect(() => () => clearTimers(), []);

  const beginHold = () => {
    if (confirmText !== CONFIRM_TEXT || isSubmitting || isHolding) return;

    const startedAt = Date.now();
    holdStartRef.current = startedAt;
    setIsHolding(true);
    setHoldProgress(1);

    intervalRef.current = window.setInterval(() => {
      if (!holdStartRef.current) return;
      const elapsed = Date.now() - holdStartRef.current;
      setHoldProgress(Math.min(100, (elapsed / HOLD_DURATION_MS) * 100));
    }, 50);

    timeoutRef.current = window.setTimeout(async () => {
      resetHold();
      setIsSubmitting(true);
      try {
        await onConfirm();
        setOpen(false);
        resetDialog();
      } catch {
        setIsSubmitting(false);
      }
    }, HOLD_DURATION_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDialog();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Remover evento permanentemente?</DialogTitle>
              <DialogDescription>
                Isso remove <strong>{eventTitle}</strong> do sistema e apaga dados operacionais ligados ao evento. A ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Digite a confirmação exata
            </Label>
            <Input
              id={inputId}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={CONFIRM_TEXT}
              autoComplete="off"
              spellCheck={false}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Escreva {CONFIRM_TEXT} e então segure o botão por 5 segundos para concluir a remoção.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              className="relative h-11 w-full overflow-hidden bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmText !== CONFIRM_TEXT || isSubmitting}
              onPointerDown={beginHold}
              onPointerUp={resetHold}
              onPointerCancel={resetHold}
              onPointerLeave={resetHold}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isSubmitting ? "Removendo..." : isHolding ? `Segurando ${Math.round(holdProgress)}%` : "Segure por 5 segundos para remover"}
              </span>
              <span
                className="absolute inset-y-0 left-0 bg-black/20 transition-[width] duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            </Button>
            <Progress value={holdProgress} className="h-2" />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}