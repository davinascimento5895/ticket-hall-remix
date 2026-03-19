import jsPDF from "jspdf";
import { formatBRL } from "@/lib/utils";

type InvoiceTicket = {
  name: string;
  attendee_name: string | null;
  price: number;
};

export type InvoicePayload = {
  invoice_number: string;
  issued_at: string;
  order_id: string;
  buyer_name: string;
  buyer_cpf: string | null;
  billing_company_name: string | null;
  billing_cnpj: string | null;
  event_title: string;
  event_location: string;
  event_date: string | null;
  payment_method: string | null;
  order_status: string;
  subtotal: number;
  discount_amount: number;
  platform_fee: number;
  total: number;
  tickets: InvoiceTicket[];
};

const colors = {
  primary: [234, 88, 12] as [number, number, number],
  dark: [20, 20, 20] as [number, number, number],
  muted: [110, 110, 120] as [number, number, number],
  border: [225, 225, 230] as [number, number, number],
  bg: [247, 247, 249] as [number, number, number],
};

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartao de credito",
  boleto: "Boleto",
  free: "Gratuito",
};

const statusLabel: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  refunded: "Estornado",
  processing: "Processando",
};

export async function generateInvoicePDF(invoice: InvoicePayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 8, "F");
  y = 16;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.setFontSize(18);
  doc.text("TicketHall", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(9);
  doc.text("Comprovante fiscal do pedido", margin, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.text("NOTA", pageWidth - margin, y - 1, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.muted);
  doc.text(invoice.invoice_number, pageWidth - margin, y + 4, { align: "right" });
  doc.text(new Date(invoice.issued_at).toLocaleDateString("pt-BR"), pageWidth - margin, y + 9, { align: "right" });

  y += 18;

  doc.setDrawColor(...colors.border);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(8);
  doc.text("COMPRADOR", margin, y);
  doc.text("EVENTO", margin + contentWidth / 2, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.text(invoice.buyer_name || "-", margin, y);
  doc.text(invoice.event_title || "-", margin + contentWidth / 2, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(9);
  if (invoice.buyer_cpf) doc.text(`CPF: ${invoice.buyer_cpf}`, margin, y);
  if (invoice.event_location) doc.text(invoice.event_location, margin + contentWidth / 2, y);

  y += 4;
  if (invoice.billing_company_name) {
    doc.text(invoice.billing_company_name, margin, y);
  }
  if (invoice.event_date) {
    doc.text(`Data: ${new Date(invoice.event_date).toLocaleDateString("pt-BR")}`, margin + contentWidth / 2, y);
  }

  y += 4;
  if (invoice.billing_cnpj) {
    doc.text(`CNPJ: ${invoice.billing_cnpj}`, margin, y);
  }

  y += 10;

  doc.setFillColor(...colors.bg);
  doc.roundedRect(margin, y - 4, contentWidth, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(8);
  doc.text("LOTE", margin + 2, y + 1);
  doc.text("PARTICIPANTE", margin + 68, y + 1);
  doc.text("VALOR", pageWidth - margin - 2, y + 1, { align: "right" });

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.dark);
  doc.setFontSize(9);

  for (const ticket of invoice.tickets) {
    if (y > 248) {
      doc.addPage();
      y = 20;
    }
    doc.text(ticket.name || "Ingresso", margin + 2, y);
    doc.text(ticket.attendee_name || "-", margin + 68, y);
    doc.text(formatBRL(ticket.price || 0), pageWidth - margin - 2, y, { align: "right" });
    y += 6;
    doc.setDrawColor(...colors.border);
    doc.line(margin + 2, y - 3.5, pageWidth - margin - 2, y - 3.5);
  }

  y += 4;
  if (y > 236) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(9);
  doc.text("Subtotal", pageWidth - margin - 40, y);
  doc.text(formatBRL(invoice.subtotal), pageWidth - margin, y, { align: "right" });
  y += 5;

  if (invoice.discount_amount > 0) {
    doc.text("Desconto", pageWidth - margin - 40, y);
    doc.text(`-${formatBRL(invoice.discount_amount)}`, pageWidth - margin, y, { align: "right" });
    y += 5;
  }

  doc.text("Taxa de servico", pageWidth - margin - 40, y);
  doc.text(formatBRL(invoice.platform_fee), pageWidth - margin, y, { align: "right" });
  y += 6;

  doc.setDrawColor(...colors.border);
  doc.line(pageWidth - margin - 46, y - 3.5, pageWidth - margin, y - 3.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.setFontSize(11);
  doc.text("TOTAL", pageWidth - margin - 40, y + 1);
  doc.text(formatBRL(invoice.total), pageWidth - margin, y + 1, { align: "right" });

  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  doc.setFontSize(8);
  doc.text(`Pagamento: ${paymentLabel[invoice.payment_method || ""] || invoice.payment_method || "-"}`, margin, y);
  doc.text(`Status: ${statusLabel[invoice.order_status] || invoice.order_status}`, margin + 70, y);
  doc.text(`Pedido: ${invoice.order_id}`, margin, y + 4);

  doc.text("Documento gerado automaticamente pela TicketHall.", margin, 285);
  doc.save(`nota_${invoice.invoice_number}.pdf`);
}