/**
 * TicketHall — Check-in API via validate-checkin edge function
 */
import { supabase } from "@/integrations/supabase/client";

export interface CheckinResult {
  success: boolean;
  result: string;
  message: string;
  attendeeName?: string;
  attendeeEmail?: string;
  tierName?: string;
  checkedInAt?: string;
}

async function resolveAuthToken(authToken?: string) {
  if (authToken) return authToken;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function tryParseErrorBody(error: unknown): Record<string, unknown> | null {
  // Supabase functions.invoke sometimes puts the raw response body in error.context.body
  const ctx = (error as any)?.context;
  if (ctx?.body) {
    const body = ctx.body;
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch {}
    }
    if (body instanceof Uint8Array) {
      try {
        return JSON.parse(new TextDecoder().decode(body));
      } catch {}
    }
    // ReadableStream or Blob – skip (rare in this path)
  }
  return null;
}

export async function validateCheckin(params: {
  qrCode: string;
  checkinListId?: string;
  scannedBy?: string;
  deviceId?: string;
}, authToken?: string): Promise<CheckinResult> {
  const resolvedAuthToken = await resolveAuthToken(authToken);

  if (!resolvedAuthToken) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke("validate-checkin", {
    body: params,
    headers: { Authorization: `Bearer ${resolvedAuthToken}` },
  });

  if (error) {
    // Try to recover business-error payload from multiple possible locations
    let payload: Record<string, unknown> | null = null;

    if (data && typeof data === "object" && "result" in data) {
      payload = data as Record<string, unknown>;
    } else {
      payload = tryParseErrorBody(error);
    }

    if (payload && "result" in payload) {
      console.warn("[checkin] validate-checkin business error", {
        result: payload.result,
        message: payload.message,
        phase: payload.phase ?? null,
        requestId: payload.requestId ?? null,
        reason: payload.reason ?? null,
      });
      return payload as CheckinResult;
    }

    console.error("[checkin] validate-checkin http error", {
      qrPrefix: params.qrCode?.slice(0, 20),
      checkinListId: params.checkinListId ?? null,
      errorMessage: (error as any)?.message ?? String(error),
      response: data ?? null,
      phase: (data as any)?.phase ?? null,
      requestId: (data as any)?.requestId ?? null,
    });

    throw new Error(
      typeof error === "object" && "message" in error
        ? (error as any).message
        : String(error)
    );
  }

  return data as CheckinResult;
}

export async function validateCheckinByTicketId(params: {
  ticketId: string;
  checkinListId?: string;
  scannedBy?: string;
}, authToken?: string): Promise<CheckinResult> {
  // Fetch the ticket's QR code first, then validate
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("qr_code")
    .eq("id", params.ticketId)
    .single();

  if (error || !ticket?.qr_code) {
    throw new Error("Ingresso não encontrado");
  }

  return validateCheckin({
    qrCode: ticket.qr_code,
    checkinListId: params.checkinListId,
    scannedBy: params.scannedBy,
  }, authToken);
}
