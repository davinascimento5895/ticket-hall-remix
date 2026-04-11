import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFImage } from "https://cdn.skypack.dev/pdf-lib@1.17.1";
import { qrcode } from "https://deno.land/x/qrcode/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting cache (simple in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { 
    r: r / 255, 
    g: g / 255, 
    b: b / 255 
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Rate limiting por IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return jsonResponse({ error: "Rate limit exceeded. Please try again later." }, 429);
    }

    // Autenticar chamador
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
    const { 
      certificateId, 
      templateId, 
      customColors,
      backgroundUrl,
      options = {} 
    } = body;

    if (!certificateId) {
      return jsonResponse({ error: "certificateId is required" }, 400);
    }

    // Validar certificateId (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(certificateId)) {
      return jsonResponse({ error: "Invalid certificateId format" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar certificado com detalhes completos
    const { data: cert, error: certError } = await supabase
      .from("certificates")
      .select(`
        *,
        events: event_id (
          id, title, start_date, end_date, venue_name, producer_id,
          selected_template_id, custom_background_url, certificate_text_config,
          certificate_colors, certificate_fields, workload_hours
        )
      `)
      .eq("id", certificateId)
      .single();

    if (certError || !cert) {
      console.error("Certificate fetch error:", certError);
      return jsonResponse({ error: "Certificate not found" }, 404);
    }

    // Verificar se certificado foi revogado
    if (cert.revoked_at) {
      return jsonResponse({ 
        error: "Certificate has been revoked",
        revokedAt: cert.revoked_at,
        reason: cert.revoked_reason
      }, 410);
    }

    // Verificar autorização
    if (userId && cert.user_id !== userId) {
      const { data: event } = await supabase
        .from("events")
        .select("producer_id")
        .eq("id", cert.event_id)
        .single();
      
      if (event?.producer_id !== userId) {
        // Verificar se é membro da equipe do evento
        const { data: teamMember } = await supabase
          .from("event_team_members")
          .select("id")
          .eq("event_id", cert.event_id)
          .eq("user_id", userId)
          .eq("status", "active")
          .single();
        
        if (!teamMember) {
          return jsonResponse({ error: "Not authorized" }, 403);
        }
      }
    }

    // Buscar assinantes do evento
    const { data: signers } = await supabase
      .from("certificate_signers")
      .select("name, role, signature_url, display_order")
      .eq("event_id", cert.event_id)
      .order("display_order", { ascending: true });

    // Buscar template se especificado
    const effectiveTemplateId = templateId || cert.events?.selected_template_id || "default";
    const { data: template } = await supabase
      .from("certificate_templates")
      .select("default_config")
      .eq("id", effectiveTemplateId)
      .single();

    // Cores efetivas (prioridade: custom > event config > template default > fallback)
    const effectiveColors = {
      primary: customColors?.primary || 
               cert.events?.certificate_colors?.primary || 
               template?.default_config?.primaryColor || 
               "#EA580B",
      secondary: customColors?.secondary || 
                 cert.events?.certificate_colors?.secondary || 
                 template?.default_config?.secondaryColor || 
                 "#1E293B",
      background: customColors?.background || 
                  cert.events?.certificate_colors?.background || 
                  "#FFFFFF",
      text: customColors?.text || 
            cert.events?.certificate_colors?.text || 
            "#1E293B",
    };

    // Background efetivo
    const effectiveBackgroundUrl = backgroundUrl || 
                                   cert.events?.custom_background_url || 
                                   null;

    // Campos a serem exibidos
    const fields = cert.events?.certificate_fields || {
      showParticipantName: true,
      showEventTitle: true,
      showEventDate: true,
      showEventLocation: true,
      showWorkload: true,
      showVerificationCode: true,
      showQrCode: true,
      showSigners: true,
      showLogo: true,
    };

    // Text config
    const textConfig = cert.events?.certificate_text_config || {
      title: "CERTIFICADO DE PARTICIPAÇÃO",
      subtitle: "Certificamos que",
      bodyText: "participou do evento",
      footerText: "Emitido pela plataforma TicketHall",
    };

    // Gerar PDF
    const pdfBytes = await generateCertificatePDF({
      cert,
      signers: signers || [],
      colors: effectiveColors,
      backgroundUrl: effectiveBackgroundUrl,
      fields,
      textConfig,
      options,
      supabaseUrl,
    });

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${cert.certificate_code}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("generate-certificate-pdf error:", error);
    return jsonResponse({ 
      error: "Internal server error",
      message: (error as Error).message 
    }, 500);
  }
});

interface PDFGenerationParams {
  cert: any;
  signers: any[];
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  backgroundUrl: string | null;
  fields: any;
  textConfig: any;
  options: any;
  supabaseUrl: string;
}

async function generateCertificatePDF(params: PDFGenerationParams): Promise<Uint8Array> {
  const { cert, signers, colors, backgroundUrl, fields, textConfig, options, supabaseUrl } = params;
  
  const pdfDoc = await PDFDocument.create();
  
  // Garantir formato A4 landscape
  // A4 = 210mm x 297mm, landscape = 297mm x 210mm
  // Em pontos: 841.89 x 595.28
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page;

  const primaryRgb = hexToRgb(colors.primary);
  const secondaryRgb = hexToRgb(colors.secondary);
  const textRgb = hexToRgb(colors.text);
  const bgRgb = hexToRgb(colors.background);

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
  });

  // Background image se fornecida
  if (backgroundUrl && options.useBackground !== false) {
    try {
      const bgResponse = await fetch(backgroundUrl);
      if (bgResponse.ok) {
        const bgBytes = await bgResponse.arrayBuffer();
        let bgImage: PDFImage | null = null;
        
        if (backgroundUrl.endsWith(".png")) {
          bgImage = await pdfDoc.embedPng(bgBytes);
        } else if (backgroundUrl.endsWith(".jpg") || backgroundUrl.endsWith(".jpeg")) {
          bgImage = await pdfDoc.embedJpg(bgBytes);
        }
        
        if (bgImage) {
          // Escalar para cobrir a página mantendo proporção
          const imgDims = bgImage.size();
          const scale = Math.max(width / imgDims.width, height / imgDims.height);
          page.drawImage(bgImage, {
            x: (width - imgDims.width * scale) / 2,
            y: (height - imgDims.height * scale) / 2,
            width: imgDims.width * scale,
            height: imgDims.height * scale,
            opacity: 0.15, // Semitransparente
          });
        }
      }
    } catch (e) {
      console.error("Failed to load background image:", e);
      // Continuar sem background
    }
  }

  // Bordas decorativas
  if (fields.showBorder !== false) {
    const cornerSize = 80;
    const borderWidth = 8;
    
    // Cantos
    page.drawRectangle({ x: 0, y: height - borderWidth, width: cornerSize, height: borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: 0, y: height - cornerSize, width: borderWidth, height: cornerSize - borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: width - cornerSize, y: height - borderWidth, width: cornerSize, height: borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: width - borderWidth, y: height - cornerSize, width: borderWidth, height: cornerSize - borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: 0, y: 0, width: cornerSize, height: borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: 0, y: borderWidth, width: borderWidth, height: cornerSize - borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: width - cornerSize, y: 0, width: cornerSize, height: borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });
    page.drawRectangle({ x: width - borderWidth, y: borderWidth, width: borderWidth, height: cornerSize - borderWidth, color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b) });

    // Moldura interna
    const margin = 40;
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - margin * 2,
      height: height - margin * 2,
      borderColor: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
      borderWidth: 2,
    });
  }

  // Logo TicketHall watermark
  if (fields.showLogo !== false) {
    const headerY = height - 90;
    const logoSize = 28;
    const ticketWidth = helveticaBold.widthOfTextAtSize("TICKET", logoSize);
    const hallWidth = helveticaBold.widthOfTextAtSize("HALL", logoSize);
    const totalWidth = ticketWidth + hallWidth + 5;
    
    page.drawText("TICKET", {
      x: (width - totalWidth) / 2,
      y: headerY,
      size: logoSize,
      font: helveticaBold,
      color: rgb(textRgb.r, textRgb.g, textRgb.b),
    });
    page.drawText("HALL", {
      x: (width - totalWidth) / 2 + ticketWidth + 5,
      y: headerY,
      size: logoSize,
      font: helveticaBold,
      color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
    });
  }

  // Título do certificado
  const titleY = height - 140;
  const titleText = textConfig.title || "CERTIFICADO DE PARTICIPAÇÃO";
  const titleSize = 24;
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleSize);
  
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: titleY,
    size: titleSize,
    font: helveticaBold,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  // Linha decorativa sob o título
  const lineWidth = 200;
  const lineY = titleY - 15;
  page.drawLine({
    start: { x: width / 2 - lineWidth / 2, y: lineY },
    end: { x: width / 2 + lineWidth / 2, y: lineY },
    thickness: 2,
    color: rgb(primaryRgb.r, primaryRgb.g, primaryRgb.b),
  });

  let currentY = lineY - 50;

  // Texto "Certificamos que"
  if (textConfig.subtitle) {
    page.drawText(textConfig.subtitle, {
      x: width / 2,
      y: currentY,
      size: 14,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 35;
  }

  // Nome do participante
  if (fields.showParticipantName !== false) {
    const attendeeName = cert.attendee_name || "Participante";
    const nameSize = 26;
    const nameWidth = helveticaBold.widthOfTextAtSize(attendeeName, nameSize);
    page.drawText(attendeeName, {
      x: (width - nameWidth) / 2,
      y: currentY,
      size: nameSize,
      font: helveticaBold,
      color: rgb(textRgb.r, textRgb.g, textRgb.b),
    });
    currentY -= 40;
  }

  // Texto de participação
  if (textConfig.bodyText) {
    page.drawText(textConfig.bodyText, {
      x: width / 2,
      y: currentY,
      size: 14,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 30;
  }

  // Título do evento
  if (fields.showEventTitle !== false) {
    const eventTitle = cert.events?.title || "Evento";
    const eventSize = 18;
    
    // Truncar se necessário
    let displayTitle = eventTitle;
    let titleFontSize = eventSize;
    while (helveticaBold.widthOfTextAtSize(displayTitle, titleFontSize) > width - 120 && displayTitle.length > 10) {
      displayTitle = displayTitle.slice(0, -1);
    }
    if (displayTitle !== eventTitle) {
      displayTitle += "...";
    }
    
    const finalTitleWidth = helveticaBold.widthOfTextAtSize(displayTitle, titleFontSize);
    page.drawText(displayTitle, {
      x: (width - finalTitleWidth) / 2,
      y: currentY,
      size: titleFontSize,
      font: helveticaBold,
      color: rgb(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
    });
    currentY -= 25;
  }

  // Data do evento
  if (fields.showEventDate !== false && cert.events?.start_date) {
    const eventDate = new Date(cert.events.start_date);
    const dateStr = eventDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
    const dateText = `realizado em ${dateStr}`;
    const dateWidth = helvetica.widthOfTextAtSize(dateText, 12);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y: currentY,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 20;
  }

  // Local do evento
  if (fields.showEventLocation !== false && cert.events?.venue_name) {
    const locationText = `Local: ${cert.events.venue_name}`;
    const locationWidth = helvetica.widthOfTextAtSize(locationText, 11);
    page.drawText(locationText, {
      x: (width - locationWidth) / 2,
      y: currentY,
      size: 11,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 20;
  }

  // Carga horária
  if (fields.showWorkload !== false && (cert.workload_hours || cert.events?.workload_hours)) {
    const hours = cert.workload_hours || cert.events?.workload_hours || 0;
    const workloadText = `Carga horária: ${hours} hora${hours !== 1 ? 's' : ''}`;
    const workloadWidth = helvetica.widthOfTextAtSize(workloadText, 11);
    page.drawText(workloadText, {
      x: (width - workloadWidth) / 2,
      y: currentY,
      size: 11,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 30;
  }

  currentY -= 20;

  // Assinantes
  if (fields.showSigners !== false && signers.length > 0) {
    const signerSpacing = Math.min(250, (width - 100) / signers.length);
    const startX = (width - (signers.length - 1) * signerSpacing) / 2;
    
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const x = startX + i * signerSpacing;
      
      // Linha de assinatura
      page.drawLine({
        start: { x: x - 80, y: currentY },
        end: { x: x + 80, y: currentY },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Nome do assinante
      const nameSize = 10;
      const nameWidth = helvetica.widthOfTextAtSize(signer.name, nameSize);
      page.drawText(signer.name, {
        x: x - nameWidth / 2,
        y: currentY - 15,
        size: nameSize,
        font: helveticaBold,
        color: rgb(textRgb.r, textRgb.g, textRgb.b),
      });
      
      // Cargo/Role
      if (signer.role) {
        const roleSize = 9;
        const roleWidth = helveticaOblique.widthOfTextAtSize(signer.role, roleSize);
        page.drawText(signer.role, {
          x: x - roleWidth / 2,
          y: currentY - 28,
          size: roleSize,
          font: helveticaOblique,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }
    
    currentY -= 60;
  }

  // Seção de verificação com QR code
  if (fields.showVerificationCode !== false || fields.showQrCode !== false) {
    const verifyBoxWidth = 350;
    const verifyBoxHeight = fields.showQrCode !== false ? 80 : 50;
    const verifyBoxX = (width - verifyBoxWidth) / 2;
    
    // Background da caixa
    page.drawRectangle({
      x: verifyBoxX,
      y: currentY - verifyBoxHeight,
      width: verifyBoxWidth,
      height: verifyBoxHeight,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

    // Código de verificação
    if (fields.showVerificationCode !== false) {
      page.drawText("CÓDIGO DE VERIFICAÇÃO", {
        x: width / 2,
        y: currentY - 15,
        size: 9,
        font: helveticaBold,
        color: rgb(0.6, 0.6, 0.6),
      });
      
      page.drawText(cert.certificate_code, {
        x: width / 2,
        y: currentY - 32,
        size: 11,
        font: helveticaOblique,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // QR Code
    if (fields.showQrCode !== false) {
      try {
        const verifyUrl = `${supabaseUrl}/functions/v1/verify-certificate-public?code=${encodeURIComponent(cert.certificate_code)}`;
        const qrDataUrl = await qrcode(verifyUrl, { size: 150 });
        const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrBytes);
        
        const qrSize = 50;
        page.drawImage(qrImage, {
          x: verifyBoxX + 10,
          y: currentY - verifyBoxHeight + 10,
          width: qrSize,
          height: qrSize,
        });
        
        // Texto ao lado do QR
        page.drawText("Escaneie para verificar", {
          x: verifyBoxX + qrSize + 20,
          y: currentY - verifyBoxHeight + 35,
          size: 9,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        page.drawText("a autenticidade deste certificado", {
          x: verifyBoxX + qrSize + 20,
          y: currentY - verifyBoxHeight + 22,
          size: 9,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
      } catch (e) {
        console.error("Failed to generate QR code:", e);
      }
    }
    
    currentY -= verifyBoxHeight + 20;
  }

  // Footer
  const footerY = 60;
  const issuedDate = new Date(cert.issued_at || cert.created_at);
  const issuedStr = issuedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  
  page.drawText(`${textConfig.footerText || "Emitido pela plataforma TicketHall"} em ${issuedStr}`, {
    x: width / 2,
    y: footerY,
    size: 10,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Website
  page.drawText("tickethall.com.br", {
    x: width / 2,
    y: footerY - 15,
    size: 9,
    font: helveticaOblique,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Versão do certificado (se > 1)
  if (cert.version && cert.version > 1) {
    page.drawText(`Versão ${cert.version}`, {
      x: width - 80,
      y: footerY - 15,
      size: 8,
      font: helvetica,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
