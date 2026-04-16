import { describe, expect, it } from "vitest";
import { extractTidWithoutSignature, isLegacyTicketId, isPlaceholderQr } from "../../supabase/functions/_shared/checkin-qr";

describe("checkin qr helpers", () => {
  it("detects raw UUID ticket ids as legacy qrs", () => {
    expect(isLegacyTicketId("2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe(true);
    expect(isLegacyTicketId("not-a-ticket-id")).toBe(false);
  });

  it("extracts tid from jwt payload without verifying signature", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payload = btoa(JSON.stringify({ tid: "ticket-123" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const token = `${header}.${payload}.signature`;

    expect(extractTidWithoutSignature(token)).toEqual({ tid: "ticket-123", reason: null });
  });

  it("detects 64-char hex placeholders", () => {
    expect(isPlaceholderQr("724a023b8f262d38f62c09fe70fe0106037c37f3f7cfb4deec886596e67ccf92")).toBe(true);
    expect(isPlaceholderQr("ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890")).toBe(true);
    expect(isPlaceholderQr("not-a-placeholder")).toBe(false);
    expect(isPlaceholderQr("2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe(false);
  });
});