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
    // For FunctionsHttpError, data contains the parsed JSON body
    if (data && typeof data === "object" && "result" in data) {
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
