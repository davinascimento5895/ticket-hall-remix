import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // C03: Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    let callerId: string | null = null;
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      callerId = user.id;
    }

    const { ticketId, eventId } = await req.json();
    const supabase = createClient(supabaseUrl, serviceKey);

    if (ticketId) {
      // Verify ownership: caller must own the ticket or be the event's producer
      if (callerId) {
        const { data: ticket } = await supabase.from("tickets").select("owner_id, event_id").eq("id", ticketId).single();
        if (!ticket) return jsonResponse({ error: "Ticket not found" }, 404);
        if (ticket.owner_id !== callerId) {
          const { data: event } = await supabase.from("events").select("producer_id").eq("id", ticket.event_id).single();
          if (!event || event.producer_id !== callerId) {
            return jsonResponse({ error: "Not authorized" }, 403);
          }
        }
      }
      const cert = await generateCertificate(supabase, ticketId);
      return jsonResponse({ success: true, certificate: cert });
    }

    if (eventId) {
      // Verify caller is the event producer
      if (callerId) {
        const { data: event } = await supabase.from("events").select("producer_id").eq("id", eventId).single();
        if (!event || event.producer_id !== callerId) {
          return jsonResponse({ error: "Not authorized" }, 403);
        }
      }

      const { data: event } = await supabase
        .from("events")
        .select("has_certificates, title")
        .eq("id", eventId)
        .single();

      if (!event?.has_certificates) {
        return jsonResponse({ error: "Certificados não habilitados para este evento" }, 400);
      }

      const { data: tickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("event_id", eventId)
        .eq("status", "used");

      if (!tickets || tickets.length === 0) {
        return jsonResponse({ success: true, generated: 0 });
      }

      const { data: existingCerts } = await supabase
        .from("certificates")
        .select("ticket_id")
        .eq("event_id", eventId);

      const existingTicketIds = new Set((existingCerts || []).map((c: any) => c.ticket_id));
      const toGenerate = tickets.filter((t: any) => !existingTicketIds.has(t.id));

      let generated = 0;
      for (const ticket of toGenerate) {
        try {
          await generateCertificate(supabase, ticket.id);
          generated++;
        } catch (e) {
          console.error(`Failed to generate cert for ticket ${ticket.id}:`, e);
        }
      }

      return jsonResponse({ success: true, generated, total: tickets.length });
    }

    return jsonResponse({ error: "ticketId or eventId required" }, 400);
  } catch (error) {
    console.error("generate-certificate error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function generateCertificate(supabase: any, ticketId: string) {
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id, event_id, owner_id, attendee_name, status, checked_in_at, events(title, start_date, end_date, has_certificates, venue_name), profiles!tickets_owner_id_fkey(full_name)")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) throw new Error("Ticket not found");
  if (ticket.status !== "used") throw new Error("Ticket must be checked in to receive certificate");
  if (!ticket.events?.has_certificates) throw new Error("Event does not issue certificates");

  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("ticket_id", ticketId)
    .single();

  if (existing) {
    const { data: cert } = await supabase.from("certificates").select("*").eq("id", existing.id).single();
    return cert;
  }

  const attendeeName = ticket.attendee_name || ticket.profiles?.full_name || "Participante";
  // Generate code matching the SQL function format: TICK-{8hex}-{YYMMDD}{3chars}
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand3 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const eventPrefix = ticket.event_id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const certCode = `TICK-${eventPrefix}-${yy}${mm}${dd}${rand3}`;

  const { data: cert, error: insertErr } = await supabase
    .from("certificates")
    .insert({
      event_id: ticket.event_id,
      ticket_id: ticketId,
      user_id: ticket.owner_id,
      certificate_code: certCode,
      attendee_name: attendeeName,
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  await supabase.from("notifications").insert({
    user_id: ticket.owner_id,
    type: "certificate_issued",
    title: "Certificado disponível!",
    body: `Seu certificado de participação em "${ticket.events.title}" está disponível.`,
    data: { eventId: ticket.event_id, certificateId: cert.id },
  });

  return cert;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
