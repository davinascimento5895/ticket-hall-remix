import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceCall = token === serviceKey;
    let userId: string | null = null;

    if (!isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      userId = user.id;
    }

    const body = await req.json();
    const { certificateId, previewData } = body;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ============================================================
    // MODO PREVIEW - retorna dados do evento para geração local
    // ============================================================
    if (previewData) {
      if (userId) {
        const { data: event } = await supabase
          .from("events")
          .select("producer_id")
          .eq("id", previewData.eventId)
          .single();
        if (event?.producer_id !== userId) {
          return jsonResponse({ error: "Not authorized" }, 403);
        }
      }

      const { data: event } = await supabase
        .from("events")
        .select("certificate_config")
        .eq("id", previewData.eventId)
        .single();

      return jsonResponse({
        mode: "preview",
        eventId: previewData.eventId,
        certificateConfig: event?.certificate_config || {},
        previewData,
      });
    }

    // ============================================================
    // MODO CERTIFICADO REAL - retorna dados para geração local
    // ============================================================
    if (!certificateId) {
      return jsonResponse({ error: "certificateId required" }, 400);
    }

    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .select(`
        *,
        events: event_id (
          id, title, start_date, venue_name, producer_id, certificate_config
        )
      `)
      .eq("id", certificateId)
      .single();

    if (certError || !cert) {
      return jsonResponse({ error: "Certificate not found" }, 404);
    }

    if (cert.revoked_at) {
      return jsonResponse({ error: "Certificate revoked" }, 410);
    }

    if (userId && cert.user_id !== userId) {
      const { data: event } = await supabase
        .from("events")
        .select("producer_id")
        .eq("id", cert.event_id)
        .single();
      if (event?.producer_id !== userId) {
        return jsonResponse({ error: "Not authorized" }, 403);
      }
    }

    return jsonResponse({
      mode: "certificate",
      certificate: {
        id: cert.id,
        certificate_code: cert.certificate_code,
        attendee_name: cert.attendee_name,
        issued_at: cert.issued_at,
        workload_hours: cert.workload_hours,
      },
      event: cert.events,
      certificateConfig: cert.events?.certificate_config || {},
    });

  } catch (error) {
    console.error("Certificate data error:", error);
    return jsonResponse({
      error: "Request failed",
      message: (error as Error).message,
    }, 500);
  }
});
