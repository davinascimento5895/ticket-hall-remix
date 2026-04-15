import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.info("[ensure-user-profile] request", {
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.slice(0, 24) : null,
      supabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      supabaseAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
      supabaseServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    });
    if (!authHeader) {
      console.error("[ensure-user-profile] missing Authorization header");
      return new Response(JSON.stringify({ error: "No auth", code: "MISSING_AUTH_HEADER" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to get their identity
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    console.info("[ensure-user-profile] auth lookup", {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      error: userErr?.message ?? null,
    });
    if (userErr || !user) {
      console.error("[ensure-user-profile] invalid token", { message: userErr?.message ?? null });
      return new Response(JSON.stringify({ error: "Invalid token", code: "INVALID_TOKEN" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to insert profile + role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if profile exists
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    console.info("[ensure-user-profile] profile lookup", {
      userId: user.id,
      profileExists: !!existing,
    });

    if (!existing) {
      // Create profile
      const profileInsert = await admin.from("profiles").insert({
        id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "",
        avatar_url: user.user_metadata?.avatar_url || "",
      });
      console.info("[ensure-user-profile] profile insert", {
        userId: user.id,
        error: profileInsert.error?.message ?? null,
      });
    }

    // Check if buyer role exists
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "buyer")
      .maybeSingle();
    console.info("[ensure-user-profile] buyer role lookup", {
      userId: user.id,
      roleExists: !!existingRole,
    });

    if (!existingRole) {
      const roleInsert = await admin.from("user_roles").insert({
        user_id: user.id,
        role: "buyer",
      });
      console.info("[ensure-user-profile] buyer role insert", {
        userId: user.id,
        error: roleInsert.error?.message ?? null,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ensure-user-profile] internal error", err);
    return new Response(JSON.stringify({ error: "Internal error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
