export function extractTidWithoutSignature(token: string): { tid: string | null; reason: string | null } {
  const parts = token.split(".");
  if (parts.length !== 3) return { tid: null, reason: "jwt_format_invalid" };

  try {
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadPadded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(payloadPadded));
    const tid = typeof payload?.tid === "string" ? payload.tid : null;
    return { tid, reason: tid ? null : "jwt_tid_missing" };
  } catch {
    return { tid: null, reason: "jwt_payload_invalid" };
  }
}

export function isLegacyTicketId(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.trim());
}

export function isPlaceholderQr(qrCode: string): boolean {
  return /^[0-9a-f]{64}$/i.test(qrCode.trim());
}