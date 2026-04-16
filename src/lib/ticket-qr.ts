const PLACEHOLDER_QR_REGEX = /^[0-9a-f]{64}$/i;

export function isPlaceholderTicketQr(qrCode: string | null | undefined): boolean {
  return typeof qrCode === "string" && PLACEHOLDER_QR_REGEX.test(qrCode.trim());
}

export function resolveTicketQrCode(qrCode: string | null | undefined, ticketId: string): string {
  const normalizedQrCode = qrCode?.trim();

  if (!normalizedQrCode || isPlaceholderTicketQr(normalizedQrCode)) {
    return ticketId;
  }

  return normalizedQrCode;
}