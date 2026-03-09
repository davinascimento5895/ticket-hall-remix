import { useState } from "react";
import { ChevronDown, X, Calendar as CalendarIcon, Flame, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import {
  startOfToday,
  startOfTomorrow,
  endOfTomorrow,
  startOfWeek,
  endOfWeek,
  addWeeks,
  endOfDay,
  isSaturday,
  isSunday,
  nextSaturday,
  nextSunday,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────

export interface EventFilters {
  category: string;
  datePreset: DatePreset;
  dateRange: DateRange | undefined;
  priceMin: string;
  priceMax: string;
  modality: "all" | "presential" | "online";
  sort: "date" | "relevance";
}
  priceMax: string;
  modality: "all" | "presential" | "online";
  sort: "date" | "relevance";
}

export const defaultEventFilters: EventFilters = {
  category: "",
  datePreset: null,
  dateRange: undefined,
  priceMin: "",
  priceMax: "",
  modality: "all",
  sort: "date",
};

type DatePreset = "hoje" | "amanha" | "semana" | "fim_de_semana" | "proxima_semana" | null;

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "amanha", label: "Amanhã" },
  { value: "semana", label: "Nesta semana" },
  { value: "fim_de_semana", label: "Neste fim de semana" },
  { value: "proxima_semana", label: "Na próxima semana" },
];

export function getDateRangeFromPreset(preset: DatePreset): { start: Date; end: Date } | null {
  if (!preset) return null;
  const today = startOfToday();
  switch (preset) {
    case "hoje":
      return { start: today, end: endOfDay(today) };
    case "amanha":
      return { start: startOfTomorrow(), end: endOfTomorrow() };
    case "semana": {
      const ws = startOfWeek(today, { weekStartsOn: 0 });
      const we = endOfWeek(today, { weekStartsOn: 0 });
      return { start: today > ws ? today : ws, end: we };
    }
    case "fim_de_semana": {
      if (isSaturday(today)) {
        const sun = new Date(today);
        sun.setDate(sun.getDate() + 1);
        return { start: today, end: endOfDay(sun) };
      } else if (isSunday(today)) {
        return { start: today, end: endOfDay(today) };
      }
      return { start: nextSaturday(today), end: endOfDay(nextSunday(today)) };
    }
    case "proxima_semana": {
      const ns = startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
      const ne = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });
      return { start: ns, end: ne };
    }
    default:
      return null;
  }
}

// ─── Sub-components ──────────────────────────────────────

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
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-muted"
      )}
    >
      {label}
      {active && <X className="inline-block h-3 w-3 ml-1 -mr-0.5" />}
    </button>
  );
}

function FilterDropdown({
  label,
  active,
  activeLabel,
  onClear,
  children,
  align = "start",
  className,
}: {
  label: string;
  active: boolean;
  activeLabel?: string;
  onClear?: () => void;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap",
            active
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-foreground hover:bg-muted",
            className
          )}
        >
          {active && activeLabel ? activeLabel : label}
          {active && onClear ? (
            <X
              className="h-3.5 w-3.5 ml-0.5 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("p-4", className)} sideOffset={8}>
        {children}
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Component ──────────────────────────────────────

interface Props {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
}

export function EventFilterBar({ filters, onChange }: Props) {
  const update = (partial: Partial<EventFilters>) =>
    onChange({ ...filters, ...partial });

  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === filters.category)?.label;

  // Date label
  const getDateLabel = (): string | undefined => {
    if (filters.datePreset) {
      return DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label;
    }
    if (filters.dateRange?.from) {
      if (filters.dateRange.to) {
        return `${format(filters.dateRange.from, "dd/MM")} – ${format(filters.dateRange.to, "dd/MM")}`;
      }
      return format(filters.dateRange.from, "dd/MM/yyyy");
    }
    return undefined;
  };

  const dateLabel = getDateLabel();
  const hasDateFilter = !!filters.datePreset || !!filters.dateRange?.from;
  const hasPriceFilter = !!filters.priceMin || !!filters.priceMax;

  const priceLabel = hasPriceFilter
    ? filters.priceMin && filters.priceMax
      ? `R$${filters.priceMin} – R$${filters.priceMax}`
      : filters.priceMin
        ? `A partir de R$${filters.priceMin}`
        : `Até R$${filters.priceMax}`
    : undefined;

  const modalityLabel =
    filters.modality === "presential" ? "Presencial" :
    filters.modality === "online" ? "Online" : undefined;

  const activeCount = [
    !!filters.category,
    hasDateFilter,
    hasPriceFilter,
    filters.modality !== "all",
    filters.sort !== "date",
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-sm font-medium text-muted-foreground shrink-0 hidden sm:block">Filtrar por</span>

        {/* Category */}
        <FilterDropdown
          label="Categoria"
          active={!!filters.category}
          activeLabel={categoryLabel}
          onClear={() => update({ category: "" })}
        >
          <div className="space-y-1 min-w-[200px]">
            <p className="text-sm font-semibold mb-2">Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.filter(c => c.value !== "").map((cat) => (
                <FilterChip
                  key={cat.value}
                  label={cat.label}
                  active={filters.category === cat.value}
                  onClick={() => update({ category: filters.category === cat.value ? "" : cat.value })}
                />
              ))}
            </div>
          </div>
        </FilterDropdown>

        {/* Date */}
        <FilterDropdown
          label="Data"
          active={!!hasDateFilter}
          activeLabel={dateLabel}
          onClear={() => update({ datePreset: null, dateRange: undefined })}
          className="w-auto"
        >
          <div className="min-w-[300px] sm:min-w-[580px]">
            <p className="text-sm font-semibold mb-1">Data</p>
            <p className="text-xs text-muted-foreground mb-3">Selecione uma ou mais datas</p>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DATE_PRESETS.map((p) => (
                <FilterChip
                  key={p.value}
                  label={p.label}
                  active={filters.datePreset === p.value}
                  onClick={() => {
                    if (filters.datePreset === p.value) {
                      update({ datePreset: null, dateRange: undefined });
                    } else {
                      // Set preset and also set dateRange for calendar visual
                      const range = getDateRangeFromPreset(p.value);
                      update({
                        datePreset: p.value,
                        dateRange: range ? { from: range.start, to: range.end } : undefined,
                      });
                    }
                  }}
                />
              ))}
            </div>

            {/* Calendar */}
            <Calendar
              mode="multiple"
              selected={filters.dateRange || undefined}
              onSelect={(dates) =>
                update({ dateRange: dates && dates.length > 0 ? dates : null, datePreset: null })
              }
              numberOfMonths={2}
              locale={ptBR}
              disabled={(date) => date < startOfToday()}
              className="p-3 pointer-events-auto"
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update({ datePreset: null, dateRange: null })}
              >
                Limpar
              </Button>
            </div>
          </div>
        </FilterDropdown>

        {/* Price */}
        <FilterDropdown
          label="Preço"
          active={hasPriceFilter}
          activeLabel={priceLabel}
          onClear={() => update({ priceMin: "", priceMax: "" })}
        >
          <div className="min-w-[220px] space-y-3">
            <p className="text-sm font-semibold">Preço</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mín R$"
                value={filters.priceMin}
                onChange={(e) => update({ priceMin: e.target.value })}
                className="text-sm h-9"
              />
              <Input
                type="number"
                placeholder="Máx R$"
                value={filters.priceMax}
                onChange={(e) => update({ priceMax: e.target.value })}
                className="text-sm h-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Até R$50", min: "", max: "50" },
                { label: "Até R$100", min: "", max: "100" },
                { label: "Até R$200", min: "", max: "200" },
                { label: "R$200+", min: "200", max: "" },
              ].map((p) => (
                <FilterChip
                  key={p.label}
                  label={p.label}
                  active={filters.priceMin === p.min && filters.priceMax === p.max}
                  onClick={() => {
                    if (filters.priceMin === p.min && filters.priceMax === p.max) {
                      update({ priceMin: "", priceMax: "" });
                    } else {
                      update({ priceMin: p.min, priceMax: p.max });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </FilterDropdown>

        {/* Modality */}
        <FilterDropdown
          label="Tipo Evento"
          active={filters.modality !== "all"}
          activeLabel={modalityLabel}
          onClear={() => update({ modality: "all" })}
        >
          <div className="min-w-[160px] space-y-1">
            <p className="text-sm font-semibold mb-2">Tipo de evento</p>
            {([
              { value: "all", label: "Todos" },
              { value: "presential", label: "Presencial" },
              { value: "online", label: "Online" },
            ] as const).map((m) => (
              <button
                key={m.value}
                onClick={() => update({ modality: m.value })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  filters.modality === m.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Divider */}
        <div className="h-6 w-px bg-border shrink-0 hidden sm:block" />

        <span className="text-sm font-medium text-muted-foreground shrink-0 hidden sm:block">Ordenar por</span>

        {/* Sort */}
        <FilterDropdown
          label={filters.sort === "relevance" ? "Relevância" : "Data"}
          active={filters.sort === "relevance"}
          activeLabel={filters.sort === "relevance" ? "Relevância" : undefined}
          onClear={filters.sort === "relevance" ? () => update({ sort: "date" }) : undefined}
        >
          <div className="min-w-[160px] space-y-1">
            <p className="text-sm font-semibold mb-2">Ordenar por</p>
            {([
              { value: "date", label: "Data (mais próximos)", icon: CalendarIcon },
              { value: "relevance", label: "Relevância (em alta)", icon: Flame },
            ] as const).map((s) => (
              <button
                key={s.value}
                onClick={() => update({ sort: s.value })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                  filters.sort === s.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </FilterDropdown>
      </div>

      {/* Active filters summary - mobile friendly */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{activeCount} filtro{activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}</span>
          <button
            onClick={() => onChange({ ...defaultEventFilters })}
            className="text-xs text-primary hover:underline"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
}
