import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple HMAC-SHA256 JWT for new QR code
async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, recipientEmail } = await req.json();
    if (!ticketId || !recipientEmail) {
      throw new Error("ticketId and recipientEmail are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qrSecret = Deno.env.get("QR_SECRET") || "tickethall-dev-secret-change-me";

    // Validate caller from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getUser();
    if (claimsErr || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = claims.user.id;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get the ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("*, ticket_tiers(is_transferable, name), events(title)")
      .eq("id", ticketId)
      .single();

    if (ticketErr || !ticket) {
      return jsonResponse({ error: "Ingresso não encontrado" }, 404);
    }

    // 2. Verify ownership
    if (ticket.owner_id !== callerId) {
      return jsonResponse({ error: "Você não é o dono deste ingresso" }, 403);
    }

    // 3. Verify ticket is active
    if (ticket.status !== "active") {
      return jsonResponse({ error: `Ingresso não pode ser transferido (status: ${ticket.status})` }, 400);
    }

    // 4. Check if tier allows transfer
    if (ticket.ticket_tiers && !ticket.ticket_tiers.is_transferable) {
      return jsonResponse({ error: "Este tipo de ingresso não permite transferência" }, 400);
    }

    // 5. Can't transfer to yourself
    const callerEmail = claims.user.email;
    if (callerEmail?.toLowerCase() === recipientEmail.toLowerCase()) {
      return jsonResponse({ error: "Você não pode transferir para si mesmo" }, 400);
    }

    // 6. Find or note recipient — look up by email in auth
    const { data: recipientProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", (
        await supabase.auth.admin.listUsers()
      ).data.users.find((u: any) => u.email?.toLowerCase() === recipientEmail.toLowerCase())?.id || "00000000-0000-0000-0000-000000000000");

    let recipientId: string | null = null;

    // Search for user by email via auth admin API
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const recipientUser = authUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === recipientEmail.toLowerCase()
    );

    if (recipientUser) {
      recipientId = recipientUser.id;
    }

    if (!recipientId) {
      return jsonResponse({ error: "Destinatário não encontrado. O email precisa estar cadastrado na plataforma." }, 404);
    }

    // 7. Generate new QR code (invalidates the old one)
    const newPayload = {
      tid: ticket.id,
      eid: ticket.event_id,
      oid: ticket.order_id,
      uid: recipientId,
      v: 1,
      iat: Math.floor(Date.now() / 1000),
    };
    const newJwt = await createJWT(newPayload, qrSecret);
    const newQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(newJwt)}`;

    // 8. Build transfer history entry
    const transferEntry = {
      from: callerId,
      to: recipientId,
      at: new Date().toISOString(),
      fromEmail: callerEmail,
      toEmail: recipientEmail,
    };

    const existingHistory = Array.isArray(ticket.transfer_history) ? ticket.transfer_history : [];

    // 9. Update ticket atomically
    const { error: updateErr } = await supabase
      .from("tickets")
      .update({
        owner_id: recipientId,
        qr_code: newJwt,
        qr_code_image_url: newQrImageUrl,
        transfer_history: [...existingHistory, transferEntry],
        attendee_name: null, // Clear attendee — new owner can set
        attendee_email: recipientEmail,
        attendee_cpf: null,
      })
      .eq("id", ticketId)
      .eq("status", "active"); // extra safety

    if (updateErr) {
      console.error("Transfer update error:", updateErr);
      return jsonResponse({ error: "Erro ao transferir ingresso" }, 500);
    }

    // 10. Send notifications to both parties
    const eventTitle = (ticket as any).events?.title || "Evento";
    const tierName = (ticket as any).ticket_tiers?.name || "Ingresso";

    await supabase.from("notifications").insert([
      {
        user_id: callerId,
        type: "transfer_sent",
        title: "Ingresso transferido",
        body: `Seu ingresso "${tierName}" para ${eventTitle} foi transferido para ${recipientEmail}.`,
        data: { ticketId, recipientEmail },
      },
      {
        user_id: recipientId,
        type: "transfer_received",
        title: "Ingresso recebido!",
        body: `Você recebeu um ingresso "${tierName}" para ${eventTitle}.`,
        data: { ticketId, fromEmail: callerEmail },
      },
    ]);

    console.log(`Ticket ${ticketId} transferred from ${callerId} to ${recipientId}`);

    return jsonResponse({
      success: true,
      message: "Ingresso transferido com sucesso!",
      recipientEmail,
    });
  } catch (error) {
    console.error("transfer-ticket error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
