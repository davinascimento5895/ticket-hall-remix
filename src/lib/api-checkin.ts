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

export async function validateCheckin(params: {
  qrCode: string;
  checkinListId?: string;
  scannedBy?: string;
  deviceId?: string;
}): Promise<CheckinResult> {
  const { data, error } = await supabase.functions.invoke("validate-checkin", {
    body: params,
  });

  if (error) {
    // Edge function returned non-2xx — parse the body
    const parsed = typeof error === "object" && "message" in error ? error : { message: String(error) };
    throw new Error(parsed.message || "Erro no check-in");
  }

  return data as CheckinResult;
}

export async function validateCheckinByTicketId(params: {
  ticketId: string;
  checkinListId?: string;
  scannedBy?: string;
}): Promise<CheckinResult> {
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
  });
}
