import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pendente", classes: "bg-warning/15 text-warning border-warning/20" },
  processing: { label: "Processando", classes: "bg-info/15 text-info border-info/20" },
  paid: { label: "Pago", classes: "bg-success/15 text-success border-success/20" },
  cancelled: { label: "Cancelado", classes: "bg-destructive/15 text-destructive border-destructive/20" },
  refunded: { label: "Estornado", classes: "bg-muted text-muted-foreground border-border" },
  expired: { label: "Expirado", classes: "bg-muted text-muted-foreground border-border" },
  active: { label: "Ativo", classes: "bg-success/15 text-success border-success/20" },
  used: { label: "Utilizado", classes: "bg-muted text-muted-foreground border-border" },
  transferred: { label: "Transferido", classes: "bg-info/15 text-info border-info/20" },
};

export function getOrderStatusLabel(status: string): string {
  return statusConfig[status]?.label || status;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, classes: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border", config.classes)}>
      {config.label}
    </span>
  );
}
