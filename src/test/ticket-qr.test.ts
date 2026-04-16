import { describe, expect, it } from "vitest";
import { resolveTicketQrCode } from "@/lib/ticket-qr";

describe("ticket qr resolver", () => {
  it("falls back to the ticket id when the stored qr is a placeholder hex", () => {
    expect(resolveTicketQrCode("a403401abcb60a6943ecb3a9a4f00571b9484e00630982f5b62af3a5834165c4", "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe(
      "2f1afb98-416b-4b14-a958-1c91c69ab4ed",
    );
  });

  it("keeps a real signed qr code", () => {
    expect(resolveTicketQrCode("header.payload.signature", "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe("header.payload.signature");
  });

  it("trims whitespace before checking placeholder", () => {
    expect(resolveTicketQrCode("  724a023b8f262d38f62c09fe70fe0106037c37f3f7cfb4deec886596e67ccf92  ", "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe(
      "2f1afb98-416b-4b14-a958-1c91c69ab4ed",
    );
  });

  it("falls back to ticket id when qr is null or empty", () => {
    expect(resolveTicketQrCode(null, "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe("2f1afb98-416b-4b14-a958-1c91c69ab4ed");
    expect(resolveTicketQrCode("", "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe("2f1afb98-416b-4b14-a958-1c91c69ab4ed");
    expect(resolveTicketQrCode(undefined, "2f1afb98-416b-4b14-a958-1c91c69ab4ed")).toBe("2f1afb98-416b-4b14-a958-1c91c69ab4ed");
  });
});