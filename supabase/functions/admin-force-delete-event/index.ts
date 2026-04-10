import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const eventId = body?.eventId ?? body?.p_event_id;

    if (!eventId || typeof eventId !== "string") {
      return jsonResponse({ error: "eventId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = userData.user.id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });

    if (roleError) {
      console.error("admin-force-delete-event role check error:", roleError);
      return jsonResponse({ error: "Falha ao validar permissao de admin" }, 500);
    }

    if (!isAdmin) {
      return jsonResponse({ error: "Sem permissao para remover este evento" }, 403);
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) {
      console.error("admin-force-delete-event load error:", eventError);
      return jsonResponse({ error: "Erro ao carregar evento" }, 500);
    }

    if (!event) {
      return jsonResponse({ error: "Evento nao encontrado" }, 404);
    }

    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from("tickets")
      .select("id")
      .eq("event_id", eventId);

    if (ticketsError) {
      console.error("admin-force-delete-event tickets load error:", ticketsError);
      return jsonResponse({ error: "Erro ao carregar ingressos do evento" }, 500);
    }

    const ticketIds = (tickets ?? []).map((ticket) => ticket.id).filter((ticketId): ticketId is string => Boolean(ticketId));

    const { data: checkinLists, error: checkinListsError } = await supabaseAdmin
      .from("checkin_lists")
      .select("id")
      .eq("event_id", eventId);

    if (checkinListsError) {
      console.error("admin-force-delete-event checkin lists load error:", checkinListsError);
      return jsonResponse({ error: "Erro ao carregar listas de check-in" }, 500);
    }

    const checkinListIds = (checkinLists ?? []).map((checkinList) => checkinList.id).filter((checkinListId): checkinListId is string => Boolean(checkinListId));

    if (ticketIds.length > 0) {
      const { error } = await supabaseAdmin.from("checkin_scan_logs").delete().in("ticket_id", ticketIds);
      if (error) {
        console.error("admin-force-delete-event ticket scan log delete error:", error);
        return jsonResponse({ error: "Erro ao remover logs de check-in" }, 500);
      }

      const { error: resaleTicketError } = await supabaseAdmin.from("resale_listings").delete().in("ticket_id", ticketIds);
      if (resaleTicketError) {
        console.error("admin-force-delete-event resale listing ticket delete error:", resaleTicketError);
        return jsonResponse({ error: "Erro ao remover anúncios de revenda" }, 500);
      }
    }

    if (checkinListIds.length > 0) {
      const { error } = await supabaseAdmin.from("checkin_scan_logs").delete().in("checkin_list_id", checkinListIds);
      if (error) {
        console.error("admin-force-delete-event checkin list log delete error:", error);
        return jsonResponse({ error: "Erro ao remover logs de check-in" }, 500);
      }
    }

    const { error: resaleEventError } = await supabaseAdmin.from("resale_listings").delete().eq("event_id", eventId);
    if (resaleEventError) {
      console.error("admin-force-delete-event resale listing delete error:", resaleEventError);
      return jsonResponse({ error: "Erro ao remover anuncios de revenda" }, 500);
    }

    const { error: webhooksError } = await supabaseAdmin.from("webhooks").delete().eq("event_id", eventId);
    if (webhooksError) {
      console.error("admin-force-delete-event webhooks delete error:", webhooksError);
      return jsonResponse({ error: "Erro ao remover webhooks" }, 500);
    }

    const { error: messagesError } = await supabaseAdmin.from("producer_messages").delete().eq("event_id", eventId);
    if (messagesError) {
      console.error("admin-force-delete-event producer messages delete error:", messagesError);
      return jsonResponse({ error: "Erro ao remover mensagens do produtor" }, 500);
    }

    const { error: analyticsError } = await supabaseAdmin.from("event_analytics").delete().eq("event_id", eventId);
    if (analyticsError) {
      console.error("admin-force-delete-event analytics delete error:", analyticsError);
      return jsonResponse({ error: "Erro ao remover analytics do evento" }, 500);
    }

    const { error: sessionsError } = await supabaseAdmin.from("checkin_sessions").delete().eq("event_id", eventId);
    if (sessionsError) {
      console.error("admin-force-delete-event sessions delete error:", sessionsError);
      return jsonResponse({ error: "Erro ao remover sessoes de check-in" }, 500);
    }

    const { error: waitlistError } = await supabaseAdmin.from("waitlist").delete().eq("event_id", eventId);
    if (waitlistError) {
      console.error("admin-force-delete-event waitlist delete error:", waitlistError);
      return jsonResponse({ error: "Erro ao remover waitlist" }, 500);
    }

    const { error: ordersError } = await supabaseAdmin.from("orders").delete().eq("event_id", eventId);
    if (ordersError) {
      console.error("admin-force-delete-event orders delete error:", ordersError);
      return jsonResponse({ error: "Erro ao remover pedidos" }, 500);
    }

    const { error: eventDeleteError } = await supabaseAdmin.from("events").delete().eq("id", eventId);
    if (eventDeleteError) {
      console.error("admin-force-delete-event event delete error:", eventDeleteError);
      return jsonResponse({ error: "Erro ao remover evento" }, 500);
    }

    return jsonResponse({ success: true, message: `Evento "${event.title}" removido com sucesso.` });
  } catch (error) {
    console.error("admin-force-delete-event error:", error);
    return jsonResponse(
      { error: (error as Error).message || "Erro ao remover evento" },
      500,
    );
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}