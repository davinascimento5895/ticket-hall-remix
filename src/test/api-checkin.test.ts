import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockInvoke, mockTicketSingle, mockTicketEq, mockTicketSelect, mockFrom } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockInvoke = vi.fn();
  const mockTicketSingle = vi.fn();
  const mockTicketEq = vi.fn(() => ({ single: mockTicketSingle }));
  const mockTicketSelect = vi.fn(() => ({ eq: mockTicketEq }));
  const mockFrom = vi.fn(() => ({ select: mockTicketSelect }));

  return {
    mockGetSession,
    mockInvoke,
    mockTicketSingle,
    mockTicketEq,
    mockTicketSelect,
    mockFrom,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    functions: { invoke: mockInvoke },
    from: mockFrom,
  },
}));

import { validateCheckin, validateCheckinByTicketId } from "@/lib/api-checkin";

describe("api-checkin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends an explicit bearer token when invoking validate-checkin", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true, result: "success", message: "ok" }, error: null });

    await validateCheckin({ qrCode: "qr-123", checkinListId: "list-1", scannedBy: "staff-1" }, "session-token");

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith("validate-checkin", {
      body: { qrCode: "qr-123", checkinListId: "list-1", scannedBy: "staff-1" },
      headers: { Authorization: "Bearer session-token" },
    });
  });

  it("falls back to the active session when no token is passed", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "fallback-token" } } });
    mockInvoke.mockResolvedValue({ data: { success: true, result: "success", message: "ok" }, error: null });

    await validateCheckin({ qrCode: "qr-456" });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith("validate-checkin", {
      body: { qrCode: "qr-456" },
      headers: { Authorization: "Bearer fallback-token" },
    });
  });

  it("forwards the token through validateCheckinByTicketId", async () => {
    mockTicketSingle.mockResolvedValue({ data: { qr_code: "qr-from-ticket" }, error: null });
    mockInvoke.mockResolvedValue({ data: { success: true, result: "success", message: "ok" }, error: null });

    await validateCheckinByTicketId({ ticketId: "ticket-1", checkinListId: "list-1", scannedBy: "staff-1" }, "session-token");

    expect(mockInvoke).toHaveBeenCalledWith("validate-checkin", {
      body: { qrCode: "qr-from-ticket", checkinListId: "list-1", scannedBy: "staff-1" },
      headers: { Authorization: "Bearer session-token" },
    });
  });
});