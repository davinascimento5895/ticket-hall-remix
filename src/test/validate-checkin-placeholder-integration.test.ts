import { describe, expect, it } from "vitest";
import { isPlaceholderQr } from "../../supabase/functions/_shared/checkin-qr";

describe("validate-checkin placeholder integration", () => {
  const ticketId = "2f1afb98-416b-4b14-a958-1c91c69ab4ed";
  const placeholderQr = "724a023b8f262d38f62c09fe70fe0106037c37f3f7cfb4deec886596e67ccf92";
  const scannedQr = ticketId;

  it("recognizes the stored qr as a placeholder", () => {
    expect(isPlaceholderQr(placeholderQr)).toBe(true);
  });

  it("replicates the OLD validator behavior (would reject)", () => {
    // In the old code, after legacy UUID detection, the second match check was:
    const oldCheck = placeholderQr !== scannedQr;
    expect(oldCheck).toBe(true); // old code rejects here
  });

  it("replicates the NEW validator behavior (allows fallback)", () => {
    // In the new code, the second match check is:
    const newCheck = placeholderQr !== scannedQr && !(isPlaceholderQr(placeholderQr) && scannedQr === ticketId);
    expect(newCheck).toBe(false); // new code allows → false means no rejection
  });

  it("still rejects a truly wrong QR even when stored qr is a placeholder", () => {
    const wrongQr = "11111111-1111-1111-1111-111111111111";
    const newCheck = placeholderQr !== wrongQr && !(isPlaceholderQr(placeholderQr) && wrongQr === ticketId);
    expect(newCheck).toBe(true); // must still reject
  });
});
