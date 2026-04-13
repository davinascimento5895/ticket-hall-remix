import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { qrcode } from "https://deno.land/x/qrcode/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Generate HTML for certificate
function generateCertificateHTML(data: {
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  title: string;
  subtitle: string;
  introText: string;
  participationText: string;
  participantName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  certificateCode: string;
  workloadHours: number;
  showWorkload: boolean;
  showEventDate: boolean;
  showEventLocation: boolean;
  qrCodeDataUrl: string;
}): string {
  const isModern = data.templateId === 'modern';
  const isAcademic = data.templateId === 'academic';
  
  if (isModern) {
    return generateModernTemplate(data);
  }
  
  // Default: Executive template
  return generateExecutiveTemplate(data);
}

function generateExecutiveTemplate(data: any): string {
  const showDate = data.showEventDate && data.eventDate ? `<span style="margin: 0 10px;">📅 ${data.eventDate}</span>` : '';
  const showLocation = data.showEventLocation && data.eventLocation ? `<span style="margin: 0 10px;">📍 ${data.eventLocation}</span>` : '';
  const showWorkload = data.showWorkload && data.workloadHours ? `<span style="margin: 0 10px;">⏱ ${data.workloadHours}h</span>` : '';
  const qrCode = data.qrCodeDataUrl ? `<img src="${data.qrCodeDataUrl}" style="width: 70px; height: 70px; margin-top: 8px;" />` : '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: 297mm; 
      height: 210mm; 
      font-family: Georgia, 'Times New Roman', serif;
      background: ${data.backgroundColor};
    }
    .container {
      width: 100%;
      height: 100%;
      padding: 12mm;
      position: relative;
    }
    .outer-frame {
      position: absolute;
      top: 12px; left: 12px; right: 12px; bottom: 12px;
      border: 3px double ${data.secondaryColor};
    }
    .inner-frame {
      position: absolute;
      top: 20px; left: 20px; right: 20px; bottom: 20px;
      border: 1px solid ${data.secondaryColor};
      opacity: 0.6;
    }
    .corner {
      position: absolute;
      width: 48px;
      height: 48px;
    }
    .corner-tl { top: 16px; left: 16px; }
    .corner-tr { top: 16px; right: 16px; transform: rotate(90deg); }
    .corner-br { bottom: 16px; right: 16px; transform: rotate(180deg); }
    .corner-bl { bottom: 16px; left: 16px; transform: rotate(270deg); }
    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 72px;
      text-align: center;
    }
    .logo {
      font-size: 14px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 20px;
      color: ${data.textColor};
    }
    .logo-ticket { font-weight: 600; }
    .logo-hall { font-weight: 300; color: ${data.secondaryColor}; }
    h1 {
      font-size: 32px;
      font-weight: 600;
      color: ${data.primaryColor};
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      font-style: italic;
      color: ${data.secondaryColor};
      margin-bottom: 28px;
    }
    .divider {
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${data.secondaryColor}, transparent);
      margin: 0 auto 28px;
    }
    .intro {
      font-size: 13px;
      color: ${data.textColor};
      opacity: 0.7;
      margin-bottom: 16px;
    }
    .participant {
      font-size: 36px;
      font-weight: 600;
      color: ${data.primaryColor};
      margin-bottom: 20px;
      line-height: 1.2;
    }
    .event {
      font-size: 24px;
      font-weight: 500;
      color: ${data.primaryColor};
      margin: 12px 0;
    }
    .details {
      font-size: 12px;
      color: ${data.textColor};
      opacity: 0.7;
      margin: 16px 0;
    }
    .bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      width: 100%;
      padding-top: 32px;
      border-top: 1px solid ${data.secondaryColor}40;
      margin-top: auto;
    }
    .signature {
      text-align: center;
      flex: 1;
    }
    .sig-line {
      width: 140px;
      height: 1px;
      background: ${data.primaryColor};
      margin: 0 auto 8px;
    }
    .sig-label {
      font-size: 10px;
      color: ${data.textColor};
      opacity: 0.6;
    }
    .seal {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #d4af37, #8b6914);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: rgba(255,255,255,0.9);
    }
    .code-section {
      text-align: center;
      flex: 1;
    }
    .code-label {
      font-size: 9px;
      color: ${data.textColor};
      opacity: 0.5;
      letter-spacing: 0.1em;
    }
    .code-value {
      font-size: 11px;
      font-family: monospace;
      color: ${data.primaryColor};
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="outer-frame"></div>
    <div class="inner-frame"></div>
    
    <svg class="corner corner-tl" viewBox="0 0 48 48">
      <path d="M4 4 L4 32 Q4 44 16 44 L44 44 M4 4 L20 4 M4 4 L4 20" 
        fill="none" stroke="${data.secondaryColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <svg class="corner corner-tr" viewBox="0 0 48 48">
      <path d="M4 4 L4 32 Q4 44 16 44 L44 44 M4 4 L20 4 M4 4 L4 20" 
        fill="none" stroke="${data.secondaryColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <svg class="corner corner-br" viewBox="0 0 48 48">
      <path d="M4 4 L4 32 Q4 44 16 44 L44 44 M4 4 L20 4 M4 4 L4 20" 
        fill="none" stroke="${data.secondaryColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <svg class="corner corner-bl" viewBox="0 0 48 48">
      <path d="M4 4 L4 32 Q4 44 16 44 L44 44 M4 4 L20 4 M4 4 L4 20" 
        fill="none" stroke="${data.secondaryColor}" stroke-width="2" stroke-linecap="round"/>
    </svg>
    
    <div class="content">
      <div class="logo">
        <span class="logo-ticket">TICKET</span>
        <span class="logo-hall">HALL</span>
      </div>
      
      <h1>${data.title}</h1>
      <p class="subtitle">${data.subtitle}</p>
      <div class="divider"></div>
      
      <p class="intro">${data.introText}</p>
      <p class="participant">${data.participantName}</p>
      <p class="intro">${data.participationText}</p>
      <p class="event">${data.eventName}</p>
      
      <div class="details">
        ${showDate}
        ${showLocation}
        ${showWorkload}
      </div>
      
      <div class="bottom">
        <div class="signature">
          <div class="sig-line"></div>
          <p class="sig-label">Assinatura do Organizador</p>
        </div>
        
        <div class="seal">✓</div>
        
        <div class="code-section">
          <p class="code-label">CÓDIGO DE VERIFICAÇÃO</p>
          <p class="code-value">${data.certificateCode}</p>
          ${qrCode}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateModernTemplate(data: any): string {
  const showDate = data.showEventDate && data.eventDate ? `
    <div style="margin-bottom: 12px;">
      <p style="font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0;">Data</p>
      <p style="font-size: 13px; font-weight: 500; color: #111; margin: 4px 0 0 0;">${data.eventDate}</p>
    </div>` : '';
    
  const showLocation = data.showEventLocation && data.eventLocation ? `
    <div style="margin-bottom: 12px;">
      <p style="font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0;">Local</p>
      <p style="font-size: 13px; font-weight: 500; color: #111; margin: 4px 0 0 0;">${data.eventLocation}</p>
    </div>` : '';
    
  const qrCode = data.qrCodeDataUrl ? `<img src="${data.qrCodeDataUrl}" style="width: 60px; height: 60px; margin-top: 8px;" />` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: 297mm; 
      height: 210mm; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      position: relative;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 40%;
      height: 8px;
      background: ${data.primaryColor};
    }
    .side-line {
      position: absolute;
      top: 15%;
      left: 40px;
      width: 3px;
      height: 70%;
      background: linear-gradient(180deg, ${data.primaryColor} 0%, transparent 100%);
    }
    .content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 48px;
      height: 100%;
      padding: 48px 56px;
    }
    .left {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${data.primaryColor};
      margin-bottom: 16px;
    }
    .participant {
      font-size: 42px;
      font-weight: 600;
      color: #111;
      margin-bottom: 20px;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .participated {
      font-size: 14px;
      color: #111;
      opacity: 0.6;
      margin-bottom: 8px;
    }
    .event {
      font-size: 24px;
      font-weight: 500;
      color: ${data.secondaryColor};
      margin-bottom: 24px;
    }
    .right {
      border-left: 1px solid rgba(0,0,0,0.1);
      padding-left: 32px;
      display: flex;
      flex-direction: column;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 48px;
    }
    .logo-ticket { color: #111; }
    .logo-hall { color: ${data.primaryColor}; }
    .details {
      flex: 1;
    }
    .verification {
      padding: 12px;
      background: rgba(0,0,0,0.03);
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="side-line"></div>
  
  <div class="content">
    <div class="left">
      <p class="label">${data.title}</p>
      <p class="participant">${data.participantName}</p>
      <p class="participated">Participou de</p>
      <p class="event">${data.eventName}</p>
    </div>
    
    <div class="right">
      <div class="logo">
        <span class="logo-ticket">TICKET</span>
        <span class="logo-hall">HALL</span>
      </div>
      
      <div class="details">
        ${showDate}
        ${showLocation}
      </div>
      
      <div class="verification">
        <p style="font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0 0 4px 0;">Verificação</p>
        <p style="font-size: 11px; font-family: monospace; color: ${data.secondaryColor}; margin: 0;">${data.certificateCode}</p>
        ${qrCode}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Generate PDF using external service
async function generatePDF(html: string): Promise<Uint8Array> {
  // Try Browserless first
  const browserlessToken = Deno.env.get("BROWSERLESS_TOKEN");
  if (browserlessToken) {
    return await generateWithBrowserless(html, browserlessToken);
  }
  
  // Try PDFShift (another popular service)
  const pdfshiftKey = Deno.env.get("PDFSHIFT_API_KEY");
  if (pdfshiftKey) {
    return await generateWithPDFShift(html, pdfshiftKey);
  }
  
  // Fallback: return HTML as error message
  throw new Error(
    "Nenhum serviço de PDF configurado. " +
    "Configure BROWSERLESS_TOKEN ou PDFSHIFT_API_KEY nas variáveis de ambiente."
  );
}

async function generateWithBrowserless(html: string, token: string): Promise<Uint8Array> {
  const response = await fetch(`https://chrome.browserless.io/pdf?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html,
      options: {
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        scale: 2,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Browserless error: ${response.status}`);
  }
  
  return new Uint8Array(await response.arrayBuffer());
}

async function generateWithPDFShift(html: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: JSON.stringify({
      source: html,
      landscape: true,
      format: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`PDFShift error: ${response.status}`);
  }
  
  return new Uint8Array(await response.arrayBuffer());
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
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return jsonResponse({ error: "Rate limit exceeded" }, 429);
    }

    // Authentication
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
    const { certificateId, previewData, templateId, customColors } = body;

    const supabase = createClient(supabaseUrl, serviceKey);

    // ============================================================
    // MODO PREVIEW
    // ============================================================
    if (previewData) {
      console.log("[PDF Preview] Gerando para evento:", previewData.eventId);

      // Authorization
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

      // Get event config
      const { data: event } = await supabase
        .from("events")
        .select("selected_template_id, certificate_text_config, certificate_colors, workload_hours")
        .eq("id", previewData.eventId)
        .single();

      // Build config
      const effectiveTemplate = templateId || event?.selected_template_id || "executive";
      const colors = {
        primary: customColors?.primary || event?.certificate_colors?.primary || "#1a365d",
        secondary: customColors?.secondary || event?.certificate_colors?.secondary || "#c9a227",
        background: "#faf8f3",
        text: "#1a202c",
      };

      const textConfig = previewData.textConfig || event?.certificate_text_config || {
        title: "CERTIFICADO DE PARTICIPAÇÃO",
        subtitle: "de Participação",
        introText: "Certificamos que",
        participationText: "participou do evento",
      };

      // Generate QR
      const verifyUrl = `${supabaseUrl}/functions/v1/verify-certificate-public?code=PREVIEW-000000`;
      const qrCodeDataUrl = await qrcode(verifyUrl, { size: 120 });

      // Build data
      const html = generateCertificateHTML({
        templateId: effectiveTemplate,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        backgroundColor: colors.background,
        textColor: colors.text,
        title: textConfig.title,
        subtitle: textConfig.subtitle,
        introText: textConfig.subtitle || textConfig.introText,
        participationText: textConfig.bodyText || textConfig.participationText,
        participantName: previewData.participantName || "Nome do Participante",
        eventName: previewData.eventName || "Nome do Evento",
        eventDate: previewData.eventDate 
          ? new Date(previewData.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
          : new Date().toLocaleDateString("pt-BR"),
        eventLocation: previewData.eventLocation || "",
        certificateCode: "PREVIEW-000000",
        workloadHours: previewData.workloadHours || 0,
        showWorkload: previewData.fields?.showWorkload,
        showEventDate: previewData.fields?.showEventDate,
        showEventLocation: previewData.fields?.showEventLocation,
        qrCodeDataUrl,
      });

      // Generate PDF
      const pdfBytes = await generatePDF(html);

      return new Response(pdfBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="certificado-preview.pdf"`,
        },
      });
    }

    // ============================================================
    // MODO CERTIFICADO REAL
    // ============================================================
    if (!certificateId) {
      return jsonResponse({ error: "certificateId required" }, 400);
    }

    // Fetch certificate
    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .select(`
        *,
        events: event_id (
          id, title, start_date, venue_name, producer_id,
          selected_template_id, certificate_text_config, certificate_colors, workload_hours
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

    // Authorization
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

    // Build config
    const effectiveTemplate = templateId || cert.events?.selected_template_id || "executive";
    const colors = {
      primary: customColors?.primary || cert.events?.certificate_colors?.primary || "#1a365d",
      secondary: customColors?.secondary || cert.events?.certificate_colors?.secondary || "#c9a227",
      background: "#faf8f3",
      text: "#1a202c",
    };

    const textConfig = cert.events?.certificate_text_config || {
      title: "CERTIFICADO DE PARTICIPAÇÃO",
      subtitle: "de Participação",
      introText: "Certificamos que",
      participationText: "participou do evento",
    };

    // Generate QR
    const verifyUrl = `${supabaseUrl}/functions/v1/verify-certificate-public?code=${encodeURIComponent(cert.certificate_code)}`;
    const qrCodeDataUrl = await qrcode(verifyUrl, { size: 120 });

    // Build HTML
    const eventDate = cert.events?.start_date 
      ? new Date(cert.events.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : "";

    const html = generateCertificateHTML({
      templateId: effectiveTemplate,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      backgroundColor: colors.background,
      textColor: colors.text,
      title: textConfig.title,
      subtitle: textConfig.subtitle,
      introText: textConfig.subtitle || textConfig.introText,
      participationText: textConfig.bodyText || textConfig.participationText,
      participantName: cert.attendee_name || "Participante",
      eventName: cert.events?.title || "Evento",
      eventDate,
      eventLocation: cert.events?.venue_name || "",
      certificateCode: cert.certificate_code,
      workloadHours: cert.workload_hours || cert.events?.workload_hours || 0,
      showWorkload: cert.events?.certificate_fields?.showWorkload,
      showEventDate: cert.events?.certificate_fields?.showEventDate,
      showEventLocation: cert.events?.certificate_fields?.showEventLocation,
      qrCodeDataUrl,
    });

    // Generate PDF
    const pdfBytes = await generatePDF(html);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${cert.certificate_code}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return jsonResponse({ 
      error: "PDF generation failed",
      message: (error as Error).message 
    }, 500);
  }
});
