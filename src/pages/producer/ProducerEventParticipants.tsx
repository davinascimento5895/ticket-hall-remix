import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Settings2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, ticketCSVColumns } from "@/lib/csv-export";
import { useState, useEffect } from "react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { getEventTicketsPaginated } from "@/lib/api-producer";
import { cn } from "@/lib/utils";

type ParticipantColumnKey = "status" | "participant" | "ticket" | "tier" | "buyer" | "date" | "checkin";
type ParticipantColumnWidth = "sm" | "md" | "lg";

const participantColumns: Array<{ key: ParticipantColumnKey; label: string }> = [
  { key: "status", label: "Status" },
  { key: "participant", label: "Participante" },
  { key: "ticket", label: "Nº ingresso" },
  { key: "tier", label: "Tipo" },
  { key: "buyer", label: "Comprado por" },
  { key: "date", label: "Data" },
  { key: "checkin", label: "Check-in" },
];

const defaultColumnVisibility: Record<ParticipantColumnKey, boolean> = {
  status: true,
  participant: true,
  ticket: true,
  tier: true,
  buyer: true,
  date: true,
  checkin: true,
};

const defaultColumnWidths: Record<ParticipantColumnKey, ParticipantColumnWidth> = {
  status: "sm",
  participant: "lg",
  ticket: "sm",
  tier: "md",
  buyer: "md",
  date: "sm",
  checkin: "sm",
};

const columnWidthClassMap: Record<ParticipantColumnWidth, string> = {
  sm: "w-[120px] min-w-[120px]",
  md: "w-[180px] min-w-[180px]",
  lg: "w-[280px] min-w-[280px]",
};

export default function ProducerEventParticipants() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [columnVisibility, setColumnVisibility] = useState<Record<ParticipantColumnKey, boolean>>(defaultColumnVisibility);
  const [columnWidths, setColumnWidths] = useState<Record<ParticipantColumnKey, ParticipantColumnWidth>>(defaultColumnWidths);

  // Map UI filter values to database status values
  const dbStatus = statusFilter === "confirmed" ? "active"
    : statusFilter === "pending" ? "reserved"
    : statusFilter === "used" ? "used"
    : statusFilter === "cancelled" ? "cancelled"
    : "all";

  const {
    items: tickets,
    totalCount,
    page,
    totalPages,
    setPage,
    resetPage,
    isLoading,
    isError,
    error,
    refetch,
  } = usePaginatedQuery({
    queryKey: ["event-participants", id, dbStatus, tierFilter, search],
    queryFn: (range) =>
      getEventTicketsPaginated(
        id!,
        { status: dbStatus, tierId: tierFilter, search },
        range
      ),
    pageSize: 20,
    enabled: !!id,
  });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [statusFilter, tierFilter, search, resetPage]);

  // Separate lightweight query for summary counts (no range, just status column)
  const { data: statusCounts } = useQuery({
    queryKey: ["event-participants-counts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("status")
        .eq("event_id", id!);
      if (error) throw error;
      const counts = { active: 0, reserved: 0, cancelled: 0, total: 0 };
      (data || []).forEach((t: any) => {
        counts.total++;
        if (t.status === "active") counts.active++;
        else if (t.status === "reserved") counts.reserved++;
        else if (t.status === "cancelled") counts.cancelled++;
      });
      return counts;
    },
    enabled: !!id,
  });

  const { data: tiers } = useQuery({
    queryKey: ["event-tiers-participants", id],
    queryFn: async () => {
      const { data } = await supabase.from("ticket_tiers").select("id, name").eq("event_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  const confirmed = statusCounts?.active || 0;
  const pending = statusCounts?.reserved || 0;
  const cancelled = statusCounts?.cancelled || 0;
  const total = statusCounts?.total || 0;

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Confirmado", variant: "default" },
      reserved: { label: "Pendente", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      used: { label: "Check-in", variant: "outline" },
    };
    const m = map[s] || { label: s, variant: "secondary" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  const getColumnClassName = (key: ParticipantColumnKey) => columnWidthClassMap[columnWidths[key] || "md"];

  const visibleColumnCount = participantColumns.reduce((acc, col) => (columnVisibility[col.key] ? acc + 1 : acc), 0);

  const handleColumnVisibilityChange = (key: ParticipantColumnKey, checked: boolean) => {
    if (!checked && columnVisibility[key] && visibleColumnCount <= 1) return;
    setColumnVisibility((prev) => ({ ...prev, [key]: checked }));
  };

  const visibleColumns = participantColumns.filter((column) => columnVisibility[column.key]);

  const renderCell = (ticket: any, key: ParticipantColumnKey) => {
    switch (key) {
      case "status":
        return <td key={key} className={cn("p-3", getColumnClassName(key))}>{statusLabel(ticket.status)}</td>;
      case "participant":
        return (
          <td key={key} className={cn("p-3", getColumnClassName(key))}>
            <p className="font-medium text-foreground">{ticket.attendee_name || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{ticket.attendee_email || ""}</p>
          </td>
        );
      case "ticket":
        return <td key={key} className={cn("p-3 font-mono text-xs", getColumnClassName(key))}>{ticket.id.slice(0, 8)}</td>;
      case "tier":
        return <td key={key} className={cn("p-3 text-muted-foreground", getColumnClassName(key))}>{ticket.ticket_tiers?.name || "—"}</td>;
      case "buyer":
        return <td key={key} className={cn("p-3 text-muted-foreground", getColumnClassName(key))}>{ticket.profiles?.full_name || "—"}</td>;
      case "date":
        return (
          <td key={key} className={cn("p-3 text-muted-foreground", getColumnClassName(key))}>
            {new Date(ticket.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </td>
        );
      case "checkin":
        return (
          <td key={key} className={cn("p-3 text-muted-foreground", getColumnClassName(key))}>
            {ticket.checked_in_at
              ? new Date(ticket.checked_in_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
              : "—"}
          </td>
        );
      default:
        return <td key={key} className="p-3">—</td>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-destructive">{cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-display font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Filtros de participantes</p>
              <p className="text-xs text-muted-foreground">Combine status, tipo de ingresso e busca textual para achar rapidamente cada pessoa.</p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" title="Configurar colunas">
                    <Settings2 className="h-4 w-4 mr-1" /> Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Configurar colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {participantColumns.map((column) => (
                    <DropdownMenuSub key={column.key}>
                      <DropdownMenuSubTrigger>{column.label}</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56">
                        <DropdownMenuCheckboxItem
                          checked={columnVisibility[column.key]}
                          onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, Boolean(checked))}
                        >
                          Visível
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Largura</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={columnWidths[column.key]}
                          onValueChange={(value) => setColumnWidths((prev) => ({ ...prev, [column.key]: value as ParticipantColumnWidth }))}
                        >
                          <DropdownMenuRadioItem value="sm">Compacta</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="md">Padrão</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="lg">Larga</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-2"
                    onClick={() => {
                      setColumnVisibility(defaultColumnVisibility);
                      setColumnWidths(defaultColumnWidths);
                    }}
                  >
                    Restaurar padrao
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={() => tickets.length && exportToCSV(tickets as any, ticketCSVColumns, `participantes_${id}`)} disabled={!tickets.length} title="Exportar CSV">
                <Download className="h-4 w-4 mr-1" /> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput placeholder="Buscar por nome, email ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="used">Check-in realizado</SelectItem>
              </SelectContent>
            </Select>
            {tiers && tiers.length > 1 && (
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ingressos</SelectItem>
                  {tiers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-destructive">Erro ao carregar participantes.</p>
              <p className="text-xs text-muted-foreground mb-4">{error?.message}</p>
              <Button size="sm" onClick={() => refetch?.()}>
                Recarregar
              </Button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum participante encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm table-fixed">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    {visibleColumns.map((column) => (
                      <th key={column.key} className={cn("p-3 font-medium", getColumnClassName(column.key))}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket: any) => (
                    <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      {visibleColumns.map((column) => renderCell(ticket, column.key))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 pt-4 pb-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({totalCount} registros)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
