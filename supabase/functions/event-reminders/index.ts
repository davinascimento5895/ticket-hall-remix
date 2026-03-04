import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // Window: events starting in 23.5h–24.5h (for 24h reminder)
    const reminder24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const reminder24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    // Window: events starting in 0.5h–1.5h (for 1h reminder)
    const reminder1hStart = new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
    const reminder1hEnd = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

    let totalNotifications = 0;

    // Process 24h reminders
    const { data: events24h } = await supabase
      .from("events")
      .select("id, title, start_date, venue_name, venue_city")
      .eq("status", "published")
      .gte("start_date", reminder24hStart.toISOString())
      .lte("start_date", reminder24hEnd.toISOString());

    if (events24h && events24h.length > 0) {
      for (const event of events24h) {
        const count = await sendReminders(supabase, event, "24h");
        totalNotifications += count;
      }
    }

    // Process 1h reminders
    const { data: events1h } = await supabase
      .from("events")
      .select("id, title, start_date, venue_name, venue_city")
      .eq("status", "published")
      .gte("start_date", reminder1hStart.toISOString())
      .lte("start_date", reminder1hEnd.toISOString());

    if (events1h && events1h.length > 0) {
      for (const event of events1h) {
        const count = await sendReminders(supabase, event, "1h");
        totalNotifications += count;
      }
    }

    console.log(`event-reminders: sent ${totalNotifications} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        events24h: events24h?.length || 0,
        events1h: events1h?.length || 0,
        totalNotifications,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("event-reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function sendReminders(
  supabase: any,
  event: any,
  window: "24h" | "1h",
): Promise<number> {
  // Get all ticket owners for this event with active tickets
  const { data: tickets } = await supabase
    .from("tickets")
    .select("owner_id")
    .eq("event_id", event.id)
    .eq("status", "active");

  if (!tickets || tickets.length === 0) return 0;

  // Deduplicate owner IDs
  const ownerIds = [...new Set(tickets.map((t: any) => t.owner_id))] as string[];

  // Check which users already got this reminder (avoid duplicates)
  const reminderType = `reminder_${window}`;
  const { data: existing } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", reminderType)
    .in("user_id", ownerIds)
    .contains("data", { eventId: event.id });

  const alreadyNotified = new Set((existing || []).map((n: any) => n.user_id));
  const toNotify = ownerIds.filter((id) => !alreadyNotified.has(id));

  if (toNotify.length === 0) return 0;

  const startDate = new Date(event.start_date);
  const timeStr = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = startDate.toLocaleDateString("pt-BR");

  const title = window === "24h" ? "Evento amanhã!" : "Evento em 1 hora!";
  const body =
    window === "24h"
      ? `${event.title} começa amanhã às ${timeStr}${event.venue_name ? ` em ${event.venue_name}` : ""}.`
      : `${event.title} começa em 1 hora! ${event.venue_name ? `Local: ${event.venue_name}` : ""}`;

  const notifications = toNotify.map((userId) => ({
    user_id: userId,
    type: reminderType,
    title,
    body,
    data: { eventId: event.id, startDate: event.start_date },
  }));

  // Insert in batches of 100
  for (let i = 0; i < notifications.length; i += 100) {
    const batch = notifications.slice(i, i + 100);
    await supabase.from("notifications").insert(batch);
  }

  return notifications.length;
}
