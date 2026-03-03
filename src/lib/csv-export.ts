/**
 * CSV Export Utility
 * Converts array of objects into downloadable CSV files.
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; header: string; format?: (value: any, row: T) => string }[],
  filename: string
) {
  if (!data || data.length === 0) return;

  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const separator = ";"; // Semicolon for pt-BR locale

  const headerRow = columns.map((c) => `"${c.header}"`).join(separator);

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = col.key.includes(".")
          ? col.key.split(".").reduce((o: any, k) => o?.[k], row)
          : row[col.key];
        const value = col.format ? col.format(raw, row) : raw;
        const str = value == null ? "" : String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(separator)
  );

  const csv = BOM + [headerRow, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Pre-built column configs for common tables
export const orderCSVColumns = [
  { key: "id", header: "ID" },
  { key: "profiles.full_name", header: "Comprador" },
  { key: "total", header: "Total", format: (v: number) => v?.toFixed(2) || "0" },
  { key: "platform_fee", header: "Taxa Plataforma", format: (v: number) => v?.toFixed(2) || "0" },
  { key: "payment_method", header: "Método" },
  { key: "status", header: "Status" },
  { key: "created_at", header: "Data", format: (v: string) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
];

export const userCSVColumns = [
  { key: "full_name", header: "Nome" },
  { key: "cpf", header: "CPF" },
  { key: "phone", header: "Telefone" },
  { key: "created_at", header: "Cadastro", format: (v: string) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
];

export const ticketCSVColumns = [
  { key: "id", header: "ID" },
  { key: "attendee_name", header: "Participante" },
  { key: "attendee_email", header: "Email" },
  { key: "ticket_tiers.name", header: "Lote" },
  { key: "status", header: "Status" },
  { key: "qr_code", header: "QR Code" },
  { key: "checked_in_at", header: "Check-in", format: (v: string) => v ? new Date(v).toLocaleString("pt-BR") : "" },
  { key: "created_at", header: "Criado em", format: (v: string) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
];

export const eventCSVColumns = [
  { key: "title", header: "Título" },
  { key: "slug", header: "Slug" },
  { key: "status", header: "Status" },
  { key: "venue_city", header: "Cidade" },
  { key: "start_date", header: "Início", format: (v: string) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
  { key: "end_date", header: "Fim", format: (v: string) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
];
