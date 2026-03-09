import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { BRAZILIAN_CAPITALS } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface SearchFilterValues {
  sort: string;
  priceMin: string;
  priceMax: string;
  pricePreset: string;
  category: string;
  city: string;
  timeOfDay: string;
}

const defaultFilters: SearchFilterValues = {
  sort: "",
  priceMin: "",
  priceMax: "",
  pricePreset: "",
  category: "",
  city: "",
  timeOfDay: "all",
};

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Maior avaliação" },
  { value: "deals", label: "Ofertas" },
];

const PRICE_PRESETS = [
  { value: "to100", label: "Até R$100" },
  { value: "to200", label: "Até R$200" },
  { value: "from200", label: "A partir de R$200" },
];

const TIME_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "morning", label: "Manhã" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noite" },
  { value: "dawn", label: "Madrugada" },
];

const topCities = BRAZILIAN_CAPITALS.filter((c) => c.featured).map((c) => c.name);

interface Props {
  filters: SearchFilterValues;
  onChange: (filters: SearchFilterValues) => void;
  activeCount: number;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function FilterBody({
  filters,
  setLocal,
}: {
  filters: SearchFilterValues;
  setLocal: React.Dispatch<React.SetStateAction<SearchFilterValues>>;
}) {
  const handlePricePreset = (preset: string) => {
    if (filters.pricePreset === preset) {
      setLocal((f) => ({ ...f, pricePreset: "", priceMin: "", priceMax: "" }));
      return;
    }
    if (preset === "to100") {
      setLocal((f) => ({ ...f, pricePreset: preset, priceMin: "", priceMax: "100" }));
    } else if (preset === "to200") {
      setLocal((f) => ({ ...f, pricePreset: preset, priceMin: "", priceMax: "200" }));
    } else if (preset === "from200") {
      setLocal((f) => ({ ...f, pricePreset: preset, priceMin: "200", priceMax: "" }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Ordenar</Label>
        <RadioGroup
          value={filters.sort}
          onValueChange={(v) => setLocal((f) => ({ ...f, sort: v }))}
          className="space-y-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center justify-between">
              <Label htmlFor={`sort-${opt.value}`} className="text-sm font-normal cursor-pointer">
                {opt.label}
              </Label>
              <RadioGroupItem value={opt.value} id={`sort-${opt.value}`} />
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Cost */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Custo</Label>
        <div className="flex gap-2 mb-3">
          <Input
            type="number"
            placeholder="A partir de R$"
            value={filters.priceMin}
            onChange={(e) =>
              setLocal((f) => ({ ...f, priceMin: e.target.value, pricePreset: "" }))
            }
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Até R$"
            value={filters.priceMax}
            onChange={(e) =>
              setLocal((f) => ({ ...f, priceMax: e.target.value, pricePreset: "" }))
            }
            className="text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => (
            <FilterChip
              key={p.value}
              label={p.label}
              active={filters.pricePreset === p.value}
              onClick={() => handlePricePreset(p.value)}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Category */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Categoria</Label>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todos"
            active={filters.category === ""}
            onClick={() => setLocal((f) => ({ ...f, category: "" }))}
          />
          {EVENT_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.value}
              label={cat.label}
              active={filters.category === cat.value}
              onClick={() =>
                setLocal((f) => ({
                  ...f,
                  category: f.category === cat.value ? "" : cat.value,
                }))
              }
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* City */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Cidade</Label>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todas"
            active={filters.city === ""}
            onClick={() => setLocal((f) => ({ ...f, city: "" }))}
          />
          {topCities.map((city) => (
            <FilterChip
              key={city}
              label={city}
              active={filters.city === city}
              onClick={() =>
                setLocal((f) => ({
                  ...f,
                  city: f.city === city ? "" : city,
                }))
              }
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Time of day */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Horário</Label>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((t) => (
            <FilterChip
              key={t.value}
              label={t.label}
              active={filters.timeOfDay === t.value}
              onClick={() => setLocal((f) => ({ ...f, timeOfDay: t.value }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchFilters({ filters, onChange, activeCount }: Props) {
  const isMobile = useIsMobile();
  const [local, setLocal] = useState<SearchFilterValues>(filters);
  const [open, setOpen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocal(filters);
    setOpen(isOpen);
  };

  const handleApply = () => {
    onChange(local);
    setOpen(false);
  };

  const handleReset = () => {
    const reset = { ...defaultFilters };
    setLocal(reset);
    onChange(reset);
    setOpen(false);
  };

  // Desktop: inline sidebar panel
  if (!isMobile) {
    return (
      <aside className="w-72 shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {activeCount}
              </Badge>
            )}
          </h3>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onChange(defaultFilters)}>
              Limpar
            </Button>
          )}
        </div>
        <FilterBody filters={filters} setLocal={(fn) => {
          const next = typeof fn === "function" ? fn(filters) : fn;
          onChange(next);
        }} />
      </aside>
    );
  }

  // Mobile: drawer
  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>Filtros</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-4 flex-1 overflow-auto" style={{ maxHeight: "60vh" }}>
          <FilterBody filters={local} setLocal={setLocal} />
        </ScrollArea>
        <DrawerFooter className="flex-row gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Limpar
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Aplicar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { defaultFilters };
