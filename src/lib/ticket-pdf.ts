import jsPDF from "jspdf";
import type { TicketDownloadData } from "@/components/checkout/TicketDownloadCard";
import { formatBRL } from "@/lib/utils";
import logoSvgUrl from "@/assets/logo-full-black.svg";

const PRIMARY_COLOR: [number, number, number] = [234, 88, 12];
const DARK_COLOR: [number, number, number] = [20, 20, 20];
const MUTED_COLOR: [number, number, number] = [120, 120, 130];
const LIGHT_BG: [number, number, number] = [245, 245, 245];
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER_COLOR: [number, number, number] = [220, 220, 220];

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

function dashedLine(doc: jsPDF, x1: number, y: number, x2: number) {
  const dashLen = 3;
  const gapLen = 2;
  let x = x1;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  while (x < x2) {
    const end = Math.min(x + dashLen, x2);
    doc.line(x, y, end, y);
    x = end + gapLen;
  }
}

export async function generateTicketPDF(data: TicketDownloadData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── Top accent bar ──
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageW, 6, "F");
  y = 10;

  // ── Brand header with logo ──
  try {
    const logoDataUrl = await loadImage(logoSvgUrl);
    // Logo aspect ratio is ~1718:513 ≈ 3.35:1
    const logoH = 8;
    const logoW = logoH * 3.35;
    doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH);
  } catch {
    // Fallback text
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_COLOR);
    doc.text("TicketHall", margin, y + 6);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text("tickethall.com.br", pageW - margin, y + 6, { align: "right" });
  y += 14;

  // ── Thin line ──
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Event Title ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_COLOR);
  const titleLines = doc.splitTextToSize(data.eventTitle, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // ── Date & Time ──
  const startDate = new Date(data.eventDate);
  const localeDateOpts = { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" } as const;
  const localeTimeOpts = { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" } as const;
  const dateStr = startDate.toLocaleDateString("pt-BR", localeDateOpts);
  const timeStr = startDate.toLocaleTimeString("pt-BR", localeTimeOpts);
  const endTimeStr = data.eventEndDate
    ? new Date(data.eventEndDate).toLocaleTimeString("pt-BR", localeTimeOpts)
    : null;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("Data:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_COLOR);
  doc.text(`${dateStr}  •  ${timeStr}${endTimeStr ? ` — ${endTimeStr}` : ""}`, margin + 12, y);
  y += 6;

  // ── Venue ──
  const locationParts = data.isOnline
    ? ["Evento Online"]
    : [data.venueName, data.venueAddress, data.venueCity, data.venueState].filter(Boolean);

  if (locationParts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Local:", margin, y);
    doc.setTextColor(...DARK_COLOR);
    const venueName = data.venueName || locationParts[0] || "";
    doc.text(venueName, margin + 14, y);
    y += 5;

    const addressParts = data.isOnline
      ? []
      : [data.venueAddress, data.venueCity, data.venueState].filter(Boolean);
    if (addressParts.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_COLOR);
      doc.setFontSize(9);
      const addrLines = doc.splitTextToSize(addressParts.join(", "), contentW - 14);
      doc.text(addrLines, margin + 14, y);
      y += addrLines.length * 4 + 2;
    }
  }

  y += 4;

  // ── Dashed separator ──
  dashedLine(doc, margin, y, pageW - margin);
  y += 8;

  // ── Ticket Info Box ──
  const boxX = margin;
  const boxW = contentW * 0.6;
  const boxH = 28;

  // Background
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(boxX, y - 2, boxW, boxH, 2, 2, "F");

  // Label
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("INGRESSO", boxX + 4, y + 4);

  // Tier name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_COLOR);
  doc.text(data.tierName, boxX + 4, y + 12);

  // Price
  if (data.tierPrice != null && data.tierPrice > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(formatBRL(data.tierPrice), boxX + 4, y + 20);
  }

  // QR code on the right
  const qrSize = 35;
  const qrX = pageW - margin - qrSize;
  const qrY = y - 2;

  try {
    const qrUrl =
      data.qrCodeImageUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qrCode)}`;
    const qrDataUrl = await loadImage(qrUrl);
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch {
    // Fallback: draw placeholder
    doc.setDrawColor(...BORDER_COLOR);
    doc.rect(qrX, qrY, qrSize, qrSize);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text("QR Code", qrX + qrSize / 2, qrY + qrSize / 2, { align: "center" });
  }

  // QR ticket ID below QR
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text(data.ticketId.slice(0, 12).toUpperCase(), qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });

  // Purchase date below ticket info box
  if (data.purchaseDate) {
    const purchaseFmt = new Date(data.purchaseDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Comprado em ${purchaseFmt}`, boxX + 4, y + boxH + 2);
  }

  y += boxH + 10;

  // ── Dashed separator ──
  dashedLine(doc, margin, y, pageW - margin);
  y += 8;

  // ── Attendee section ──
  if (data.attendeeName) {
    doc.setFillColor(...LIGHT_BG);
    const attBoxH = data.attendeeCpf ? 20 : 14;
    doc.roundedRect(margin, y - 2, contentW, attBoxH, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("PARTICIPANTE", margin + 4, y + 4);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_COLOR);
    doc.text(data.attendeeName, margin + 4, y + 12);

    if (data.attendeeCpf) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_COLOR);
      doc.text(`CPF: ${data.attendeeCpf}`, margin + 4, y + 18);
    }

    y += attBoxH + 6;
  }

  // ── Dashed separator ──
  dashedLine(doc, margin, y, pageW - margin);
  y += 8;

  // ── Order details section ──
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text("DETALHES DO PEDIDO", margin, y + 2);
  y += 8;

  const detailRows: [string, string][] = [
    ["Nº do Pedido", data.orderCode],
    ["ID do Ingresso", data.ticketId.slice(0, 8).toUpperCase()],
  ];
  if (data.paymentMethod) {
    const methodLabels: Record<string, string> = {
      pix: "PIX",
      credit_card: "Cartão de Crédito",
      boleto: "Boleto",
      free: "Gratuito",
    };
    detailRows.push(["Pagamento", methodLabels[data.paymentMethod] || data.paymentMethod]);
  }
  if (data.tierPrice != null) {
    detailRows.push(["Valor do ingresso", formatBRL(data.tierPrice)]);
  }

  doc.setFontSize(9);
  for (const [label, value] of detailRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_COLOR);
    doc.text(value, pageW - margin, y, { align: "right" });
    y += 5.5;
  }

  y += 6;

  // ── Event description (truncated) ──
  if (data.eventDescription) {
    dashedLine(doc, margin, y, pageW - margin);
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    doc.text("MENSAGEM DA ORGANIZAÇÃO", margin, y + 2);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont("helvetica", "normal");

    // Strip HTML tags and truncate
    const plainText = data.eventDescription.replace(/<[^>]*>/g, "").slice(0, 600);
    const descLines = doc.splitTextToSize(plainText, contentW);
    const maxLines = Math.min(descLines.length, 12);
    doc.text(descLines.slice(0, maxLines), margin, y);
    y += maxLines * 4 + 4;
  }

  // ── Footer ──
  y = Math.max(y + 10, 260);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Este documento é seu ingresso. Apresente o QR Code na entrada do evento.", margin, y);
  y += 4;
  doc.text("Em caso de dúvidas, acesse tickethall.com.br/faq", margin, y);

  y += 10;

  // Footer logo
  try {
    const footerLogoDataUrl = await loadImage(logoSvgUrl);
    const fLogoH = 6;
    const fLogoW = fLogoH * 3.35;
    doc.addImage(footerLogoDataUrl, "PNG", pageW / 2 - fLogoW / 2, y, fLogoW, fLogoH);
    y += fLogoH + 3;
  } catch {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("TicketHall", pageW / 2, y + 4, { align: "center" });
    y += 8;
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text("Conectando você a experiências únicas", pageW / 2, y, { align: "center" });

  // Save
  const fileName = `ingresso-${data.ticketId.slice(0, 8)}.pdf`;
  doc.save(fileName);
}
