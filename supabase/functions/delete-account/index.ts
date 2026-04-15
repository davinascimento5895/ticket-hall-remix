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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getUser();
    if (claimsErr || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.user.id;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check for active tickets (don't delete if user has upcoming events)
    const { data: activeTickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("owner_id", userId)
      .eq("status", "active")
      .limit(1);

    if (activeTickets && activeTickets.length > 0) {
      return new Response(
        JSON.stringify({ error: "Você possui ingressos ativos. Transfira ou use-os antes de excluir sua conta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anonymize profile data
    await supabase.from("profiles").update({
      full_name: "Conta Excluída",
      avatar_url: null,
      phone: null,
      document_number: null,
      document_type: "cpf",
      birth_date: null,
      city: null,
      state: null,
      preferred_categories: null,
      organizer_bio: null,
      organizer_slug: null,
      organizer_logo_url: null,
      organizer_banner_url: null,
      organizer_instagram: null,
      organizer_facebook: null,
      organizer_website: null,
    }).eq("id", userId);

    // Delete auth user (cascades user_roles, etc.)
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("Error deleting user:", deleteErr);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Account deleted: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Conta excluída com sucesso." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("delete-account error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
