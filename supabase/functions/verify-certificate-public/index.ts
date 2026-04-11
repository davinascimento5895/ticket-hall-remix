import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Cache-Control": "public, max-age=300", // Cache por 5 minutos
};

// Rate limiting configuration
const RATE_LIMIT_MAX = 30; // 30 requests
const RATE_LIMIT_WINDOW_MS = 60000; // per minute

// Simple in-memory rate limiter (use Redis for production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: Request): string {
  // Usar IP + User-Agent para identificação
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const userAgent = req.headers.get("user-agent") || "";
  return `${ip}:${userAgent.slice(0, 50)}`;
}

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_WINDOW_MS 
    });
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_MAX - 1, 
      resetIn: RATE_LIMIT_WINDOW_MS / 1000 
    };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  entry.count++;
  const remaining = RATE_LIMIT_MAX - entry.count;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  
  return { allowed: true, remaining, resetIn };
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
        { 
          error: "Rate limit exceeded", 
          message: `Too many requests. Please try again in ${rateLimit.resetIn} seconds.` 
        },
        429,
        rateLimitHeaders
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const certificateCode = url.searchParams.get("code");
    
    if (!certificateCode) {
      return jsonResponse(
        { error: "Missing required parameter: code" },
        400,
        rateLimitHeaders
      );
    }

    // Validate certificate code format
    // Format: TICK-{8 chars}-{6+ chars}
    const codeRegex = /^TICK-[A-Z0-9]{8}-[A-Z0-9]{6,}$/;
    if (!codeRegex.test(certificateCode)) {
      return jsonResponse(
        { 
          valid: false, 
          error: "Invalid certificate code format" 
        },
        400,
        rateLimitHeaders
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar certificado com informações limitadas
    // NÃO expor: user_id, ticket_id, revoked_by, etc.
    const { data: cert, error } = await supabase
      .from("certificates")
      .select(`
        id,
        certificate_code,
        attendee_name,
        issued_at,
        workload_hours,
        revoked_at,
        revoked_reason,
        version,
        events: event_id (
          title,
          start_date,
          end_date,
          venue_name,
          workload_hours as event_workload_hours
        )
      `)
      .eq("certificate_code", certificateCode)
      .single();

    if (error || !cert) {
      return jsonResponse(
        { 
          valid: false, 
          error: "Certificate not found",
          message: "O código de certificado fornecido não foi encontrado."
        },
        404,
        rateLimitHeaders
      );
    }

    // Verificar se foi revogado
    if (cert.revoked_at) {
      return jsonResponse(
        {
          valid: false,
          revoked: true,
          revokedAt: cert.revoked_at,
          reason: cert.revoked_reason || "Certificado revogado pelo emissor",
          certificateCode: cert.certificate_code,
          eventName: cert.events?.title,
          message: "Este certificado foi revogado e não é mais válido.",
        },
        200,
        rateLimitHeaders
      );
    }

    // Calcular carga horária efetiva
    const workloadHours = cert.workload_hours || cert.events?.event_workload_hours || null;

    // Resposta de sucesso - apenas dados não sensíveis
    return jsonResponse(
      {
        valid: true,
        revoked: false,
        certificateCode: cert.certificate_code,
        eventName: cert.events?.title,
        participantName: cert.attendee_name,
        eventDate: cert.events?.start_date,
        eventEndDate: cert.events?.end_date,
        eventLocation: cert.events?.venue_name,
        workload: workloadHours,
        issuedAt: cert.issued_at,
        version: cert.version,
        verificationUrl: `${supabaseUrl}/functions/v1/verify-certificate-public?code=${encodeURIComponent(certificateCode)}`,
        message: "Certificado válido e verificado.",
      },
      200,
      rateLimitHeaders
    );

  } catch (error) {
    console.error("verify-certificate-public error:", error);
    return jsonResponse(
      { 
        error: "Internal server error",
        message: "Ocorreu um erro ao verificar o certificado. Tente novamente mais tarde."
      },
      500
    );
  }
});
