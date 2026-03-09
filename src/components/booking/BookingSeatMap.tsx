import { useState, useMemo } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  seatMapConfig: any;
  onSelectSeat: (seatId: string) => void;
  selectedSeat: string | null;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  status: "available" | "sold" | "reserved" | "blocked";
  x: number;
  y: number;
}

function generateDefaultSeats(config: any): { seats: Seat[]; rows: string[]; cols: number } {
  // If config has seats array, use it
  if (config?.seats && Array.isArray(config.seats)) {
    const rows = [...new Set(config.seats.map((s: any) => s.row))].sort() as string[];
    return { seats: config.seats, rows, cols: Math.max(...config.seats.map((s: any) => s.number)) };
  }

  // Generate a default layout
  const rowCount = config?.rows || 8;
  const colCount = config?.cols || 12;
  const rowLabels = Array.from({ length: rowCount }, (_, i) => String.fromCharCode(65 + i));
  const soldSeats: Set<string> = new Set(config?.sold || []);
  const blockedSeats: Set<string> = new Set(config?.blocked || []);

  const seats: Seat[] = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      const id = `${rowLabels[r]}${c}`;
      let status: Seat["status"] = "available";
      if (soldSeats.has(id)) status = "sold";
      else if (blockedSeats.has(id)) status = "blocked";
      seats.push({ id, row: rowLabels[r], number: c, status, x: c, y: r + 1 });
    }
  }

  return { seats, rows: rowLabels, cols: colCount };
}

export function BookingSeatMap({ seatMapConfig, onSelectSeat, selectedSeat }: Props) {
  const [zoom, setZoom] = useState(1);
  const { seats, rows, cols } = useMemo(() => generateDefaultSeats(seatMapConfig || {}), [seatMapConfig]);

  const seatSize = 28 * zoom;
  const gap = 4 * zoom;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Selecione seu assento</p>

      {/* Stage indicator */}
      <div className="flex justify-center mb-2">
        <div className="px-12 py-2 rounded-t-[50%] border border-border bg-muted/50 text-xs text-muted-foreground font-medium">
          PALCO
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Seat grid */}
      <div className="overflow-auto max-h-[45vh] pb-4">
        <div className="flex flex-col items-center gap-1" style={{ minWidth: `${cols * (seatSize + gap) + 40}px` }}>
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-0.5">
              <span className="w-5 text-[10px] text-muted-foreground font-mono text-right mr-1">{row}</span>
              {seats
                .filter((s) => s.row === row)
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const isSelected = selectedSeat === seat.id;
                  const isAvailable = seat.status === "available";
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && onSelectSeat(seat.id)}
                      title={`${seat.row}${seat.number}`}
                      className={cn(
                        "rounded-sm transition-all flex items-center justify-center text-[8px] font-mono",
                        isSelected
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : isAvailable
                            ? "bg-primary/20 hover:bg-primary/40 text-primary cursor-pointer"
                            : seat.status === "sold"
                              ? "bg-muted text-muted-foreground/30 cursor-not-allowed"
                              : "bg-transparent cursor-not-allowed"
                      )}
                      style={{ width: seatSize, height: seatSize }}
                    >
                      {zoom >= 0.9 ? seat.number : ""}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary/20" /> Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary" /> Selecionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-muted" /> Ocupado
        </span>
      </div>

      {/* Selected info + continue */}
      {selectedSeat && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <span className="text-sm">
              Fileira {selectedSeat.charAt(0)}, Assento {selectedSeat.slice(1)}
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onSelectSeat("")}>
              ✕
            </Button>
          </div>
          <Button className="w-full" size="lg" onClick={() => onSelectSeat(selectedSeat)}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
