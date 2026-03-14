import { Badge } from "@/components/ui/badge";

const eventStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  ended: { label: "Encerrado", variant: "outline" },
  completed: { label: "Encerrado", variant: "outline" },
};

export function EventStatusBadge({ status }: { status: string }) {
  const config = eventStatusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/** Helper for places that just need the label string */
export function getEventStatusLabel(status: string): string {
  return eventStatusConfig[status]?.label || status;
}
