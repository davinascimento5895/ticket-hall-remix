import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { qrcode } from "https://deno.land/x/qrcode/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 60000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS / 1000 };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  entry.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - entry.count, 
    resetIn: Math.ceil((entry.resetTime - now) / 1000) 
  };
}

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const userAgent = req.headers.get("user-agent") || "";
  return `${ip}:${userAgent.slice(0, 50)}`;
}

function jsonResponse(body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
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

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId);
    
    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetIn),
    };

    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded", retryAfter: rateLimit.resetIn },
        429,
        rateLimitHeaders
      );
    }

    // Parse input
    let certificateCode: string | null = null;
    let certificateId: string | null = null;
    let size = 300;
    let format: "png" | "svg" | "dataurl" = "png";

    if (req.method === "GET") {
      const url = new URL(req.url);
      certificateCode = url.searchParams.get("code");
      certificateId = url.searchParams.get("id");
      size = parseInt(url.searchParams.get("size") || "300", 10);
      format = (url.searchParams.get("format") as any) || "png";
    } else if (req.method === "POST") {
      const body = await req.json();
      certificateCode = body.certificateCode;
      certificateId = body.certificateId;
      size = body.size || 300;
      format = body.format || "png";
    }

    // Validate size
    if (size < 100 || size > 1000) {
      return jsonResponse(
        { error: "Invalid size. Must be between 100 and 1000." },
        400,
        rateLimitHeaders
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Se tiver ID, buscar o código
    if (certificateId && !certificateCode) {
      // Verificar autenticação para acesso por ID
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse(
          { error: "Authentication required for ID-based lookup" },
          401,
          rateLimitHeaders
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const isServiceCall = token === serviceKey;
      
      if (!isServiceCall) {
        const supabaseAuth = createClient(supabaseUrl, anonKey!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
        if (userErr || !user) {
          return jsonResponse({ error: "Unauthorized" }, 401, rateLimitHeaders);
        }

        // Verificar se usuário tem acesso ao certificado
        const { data: cert } = await supabase
          .from("certificates")
          .select("user_id, event_id")
          .eq("id", certificateId)
          .single();

        if (!cert) {
          return jsonResponse({ error: "Certificate not found" }, 404, rateLimitHeaders);
        }

        if (cert.user_id !== user.id) {
          // Verificar se é produtor
          const { data: event } = await supabase
            .from("events")
            .select("producer_id")
            .eq("id", cert.event_id)
            .single();
          
          if (event?.producer_id !== user.id) {
            return jsonResponse({ error: "Not authorized" }, 403, rateLimitHeaders);
          }
        }
      }

      const { data: cert } = await supabase
        .from("certificates")
        .select("certificate_code")
        .eq("id", certificateId)
        .single();

      if (!cert) {
        return jsonResponse({ error: "Certificate not found" }, 404, rateLimitHeaders);
      }

      certificateCode = cert.certificate_code;
    }

    if (!certificateCode) {
      return jsonResponse(
        { error: "Either certificateCode or certificateId is required" },
        400,
        rateLimitHeaders
      );
    }

    // Validar formato do código
    const codeRegex = /^TICK-[A-Z0-9]{8}-[A-Z0-9]{6,}$/;
    if (!codeRegex.test(certificateCode)) {
      return jsonResponse(
        { error: "Invalid certificate code format" },
        400,
        rateLimitHeaders
      );
    }

    // Verificar se certificado existe e não está revogado
    const { data: cert } = await supabase
      .from("certificates")
      .select("id, revoked_at")
      .eq("certificate_code", certificateCode)
      .single();

    if (!cert) {
      return jsonResponse({ error: "Certificate not found" }, 404, rateLimitHeaders);
    }

    // Gerar URL de verificação
    const verifyUrl = `${supabaseUrl}/functions/v1/verify-certificate-public?code=${encodeURIComponent(certificateCode)}`;

    // Gerar QR Code
    if (format === "dataurl") {
      // Retornar apenas a data URL
      const dataUrl = await qrcode(verifyUrl, { size });
      return jsonResponse(
        {
          certificateCode,
          qrCodeDataUrl: dataUrl,
          verificationUrl: verifyUrl,
          revoked: cert.revoked_at !== null,
        },
        200,
        rateLimitHeaders
      );
    }

    // Gerar imagem PNG
    const dataUrl = await qrcode(verifyUrl, { size });
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    return new Response(imageBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qr-${certificateCode}.png"`,
        "Cache-Control": cert.revoked_at ? "private, no-cache" : "public, max-age=86400", // Cache 24h se válido
        ...rateLimitHeaders,
      },
    });

  } catch (error) {
    console.error("generate-certificate-qr error:", error);
    return jsonResponse(
      { 
        error: "Internal server error",
        message: (error as Error).message 
      },
      500
    );
  }
});
