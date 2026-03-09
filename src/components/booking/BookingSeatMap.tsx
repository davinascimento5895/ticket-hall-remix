import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  seatMapConfig: {
    imageUrl?: string;
    tierColors?: Record<string, string>;
  } | null;
  tiers?: any[];
}

export function BookingSeatMap({ seatMapConfig, tiers = [] }: Props) {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const imageUrl = seatMapConfig?.imageUrl;
  const tierColors = seatMapConfig?.tierColors || {};

  if (!imageUrl) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Nenhum mapa de setores disponível para este evento.
      </div>
    );
  }

  const MapImage = ({ className }: { className?: string }) => (
    <div
      className={className}
      style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}
    >
      <img
        src={imageUrl}
        alt="Mapa de setores do evento"
        className="max-w-full max-h-full object-contain rounded-lg"
        draggable={false}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Consulte o mapa para localizar seu setor
      </p>

      {/* Zoom controls */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Map container */}
      <div className="overflow-auto max-h-[40vh] flex items-center justify-center bg-muted/30 rounded-xl border border-border p-2">
        <MapImage />
      </div>

      {/* Legend with tier colors */}
      {tiers.length > 0 && Object.keys(tierColors).length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {tiers.map((tier) => {
            const color = tierColors[tier.name];
            if (!color) return null;
            return (
              <span key={tier.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {tier.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-4xl p-2 sm:p-4" aria-describedby={undefined}>
          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4 mr-1" /> -
              </Button>
              <span className="text-sm flex items-center px-2">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4 mr-1" /> +
              </Button>
            </div>
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-muted/30 rounded-lg p-4">
              <MapImage />
            </div>
            {tiers.length > 0 && Object.keys(tierColors).length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {tiers.map((tier) => {
                  const color = tierColors[tier.name];
                  if (!color) return null;
                  return (
                    <span key={tier.id} className="flex items-center gap-1.5 text-sm">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {tier.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
