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
    console.error("[checkin] validate-checkin http error", {
      qrPrefix: params.qrCode?.slice(0, 20),
      checkinListId: params.checkinListId ?? null,
      errorMessage: (error as any)?.message ?? String(error),
      response: data ?? null,
      phase: (data as any)?.phase ?? null,
      requestId: (data as any)?.requestId ?? null,
    });
  }

  if (error) {
    // For FunctionsHttpError, data contains the parsed JSON body
    if (data && typeof data === "object" && "result" in data) {
      console.warn("[checkin] validate-checkin business error", {
        result: (data as any).result,
        message: (data as any).message,
        phase: (data as any).phase ?? null,
        requestId: (data as any).requestId ?? null,
        reason: (data as any).reason ?? null,
      });
      return data as CheckinResult;
    }
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
