/**
 * Client-side PDF generation for certificates
 * Uses html2canvas + jsPDF with optimized settings for professional quality
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface CertificatePDFData {
  participantName: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  certificateCode: string;
  workloadHours?: number;
  primaryColor: string;
  secondaryColor: string;
  templateId: string;
  title?: string;
  introText?: string;
  participationText?: string;
  qrCodeUrl?: string;
}

/**
 * Generate professional PDF from certificate preview element
 * Optimized for print quality (300+ DPI)
 */
export async function generateCertificatePDF(
  previewElement: HTMLElement,
  filename: string = "certificado.pdf"
): Promise<void> {
  // Wait for fonts to load
  if ("fonts" in document) {
    await (document as any).fonts?.ready;
  }

  // Additional wait for any CSS animations/transitions
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Get element dimensions
  const rect = previewElement.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 2, 3);

  console.log("[PDF] Capturing element:", {
    width: rect.width,
    height: rect.height,
    pixelRatio,
  });

  // Capture with high quality settings
  const canvas = await html2canvas(previewElement, {
    scale: 3, // 3x scale = ~300 DPI for A4
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    width: previewElement.offsetWidth,
    height: previewElement.offsetHeight,
    imageTimeout: 30000,
    onclone: (clonedDoc) => {
      // Ensure cloned element has proper dimensions
      const cloned = clonedDoc.querySelector("[data-testid='certificate-preview']") as HTMLElement;
      if (cloned) {
        cloned.style.transform = "none";
        cloned.style.maxWidth = "none";
        cloned.style.width = `${previewElement.offsetWidth}px`;
        cloned.style.height = `${previewElement.offsetHeight}px`;
      }
    },
  });

  console.log("[PDF] Canvas captured:", canvas.width, "x", canvas.height);

  // Create PDF with exact A4 landscape dimensions
  // A4 landscape: 297mm x 210mm = 841.89pt x 595.28pt
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Convert canvas to high quality image
  const imageData = canvas.toDataURL("image/jpeg", 1.0);

  // Add image to PDF covering entire page
  pdf.addImage(
    imageData,
    "JPEG",
    0,
    0,
    pageWidth,
    pageHeight,
    undefined,
    "MEDIUM" // Compression: SLOW, MEDIUM, FAST, NONE
  );

  // Save PDF
  pdf.save(filename);

  console.log("[PDF] Generated successfully:", filename);
}

/**
 * Create a temporary container with certificate HTML for PDF generation
 * This allows generating PDF without the preview being visible
 */
export function createCertificateContainer(data: CertificatePDFData): HTMLElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "841.89pt"; // A4 landscape width
  container.style.height = "595.28pt"; // A4 landscape height
  container.style.overflow = "hidden";

  const isModern = data.templateId === "modern";
  const isAcademic = data.templateId === "academic";

  container.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      background: ${isModern ? "#ffffff" : "#faf8f3"};
      font-family: ${isModern ? "'Inter', system-ui, sans-serif" : "Georgia, serif"};
      position: relative;
      box-sizing: border-box;
      padding: ${isModern ? "48px 56px" : "12mm"};
    ">
      ${!isModern ? `
        <!-- Executive/Academic decorative borders -->
        <div style="
          position: absolute;
          top: 12px; left: 12px; right: 12px; bottom: 12px;
          border: 3px double ${data.secondaryColor};
          pointer-events: none;
        "></div>
        <div style="
          position: absolute;
          top: 20px; left: 20px; right: 20px; bottom: 20px;
          border: 1px solid ${data.secondaryColor};
          opacity: 0.6;
          pointer-events: none;
        "></div>
      ` : `
        <!-- Modern geometric elements -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 8px;
          background: ${data.primaryColor};
        "></div>
        <div style="
          position: absolute;
          top: 15%;
          left: 40px;
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, ${data.primaryColor} 0%, transparent 100%);
        "></div>
      `}

      <div style="
        position: relative;
        z-index: 1;
        height: 100%;
        display: ${isModern ? "grid" : "flex"};
        ${isModern ? "grid-template-columns: 1fr 300px; gap: 48px;" : "flex-direction: column; align-items: center; justify-content: center; text-align: center;"}
        padding: ${isModern ? "0" : "48px 72px"};
      ">
        ${isModern ? `
          <!-- Modern Layout - Left Column -->
          <div style="display: flex; flex-direction: column; justify-content: center;">
            <p style="
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: ${data.primaryColor};
              margin: 0 0 16px 0;
            ">${data.title || "CERTIFICADO DE PARTICIPAÇÃO"}</p>
            
            <h1 style="
              font-size: 44px;
              font-weight: 600;
              color: #111827;
              margin: 0 0 24px 0;
              line-height: 1.1;
              letter-spacing: -0.02em;
            ">${data.participantName}</h1>
            
            <p style="
              font-size: 14px;
              color: #111827;
              opacity: 0.6;
              margin: 0 0 8px 0;
            ">Participou de</p>
            
            <h2 style="
              font-size: 24px;
              font-weight: 500;
              color: ${data.secondaryColor || "#1f2937"};
              margin: 0;
              line-height: 1.3;
            ">${data.eventName}</h2>
            
            ${data.workloadHours ? `
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(234, 88, 11, 0.1);
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                color: ${data.primaryColor};
                width: fit-content;
                margin-top: 24px;
              ">
                <span>⏱</span>
                <span>${data.workloadHours} horas de carga horária</span>
              </div>
            ` : ""}
          </div>

          <!-- Modern Layout - Right Column -->
          <div style="
            border-left: 1px solid rgba(0,0,0,0.1);
            padding-left: 32px;
            display: flex;
            flex-direction: column;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 48px;
            ">
              <span style="color: #111827;">TICKET</span>
              <span style="color: ${data.primaryColor};">HALL</span>
            </div>

            <div style="flex: 1;">
              ${data.eventDate ? `
                <div style="margin-bottom: 16px;">
                  <p style="font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0;">Data</p>
                  <p style="font-size: 14px; font-weight: 500; color: #111; margin: 4px 0 0 0;">${data.eventDate}</p>
                </div>
              ` : ""}
              
              ${data.eventLocation ? `
                <div style="margin-bottom: 16px;">
                  <p style="font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0;">Local</p>
                  <p style="font-size: 14px; font-weight: 500; color: #111; margin: 4px 0 0 0;">${data.eventLocation}</p>
                </div>
              ` : ""}
            </div>

            <div style="
              padding: 12px;
              background: rgba(0,0,0,0.03);
              border-radius: 6px;
            ">
              <p style="font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #111; opacity: 0.4; margin: 0 0 4px 0;">Verificação</p>
              <p style="font-size: 11px; font-family: monospace; color: ${data.secondaryColor || "#1f2937"}; margin: 0;">${data.certificateCode}</p>
              ${data.qrCodeUrl ? `<img src="${data.qrCodeUrl}" style="width: 60px; height: 60px; margin-top: 8px;" />` : ""}
            </div>
          </div>
        ` : `
          <!-- Executive Layout -->
          <div style="margin-bottom: 20px;">
            <span style="font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: ${data.secondaryColor};">
              <strong>TICKET</strong>HALL
            </span>
          </div>

          <h1 style="
            font-size: 32px;
            font-weight: 600;
            color: ${data.primaryColor};
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin: 0 0 8px 0;
          ">${data.title || "CERTIFICADO"}</h1>
          
          <p style="
            font-size: 14px;
            font-style: italic;
            color: ${data.secondaryColor};
            margin: 0 0 28px 0;
          ">de Participação</p>

          <div style="
            width: 120px;
            height: 2px;
            background: linear-gradient(90deg, transparent, ${data.secondaryColor}, transparent);
            margin: 0 auto 28px;
          "></div>

          <p style="
            font-size: 13px;
            color: #1a202c;
            opacity: 0.7;
            margin: 0 0 16px 0;
          ">${data.introText || "Certificamos que"}</p>

          <h2 style="
            font-size: 36px;
            font-weight: 600;
            color: ${data.primaryColor};
            margin: 0 0 20px 0;
            line-height: 1.2;
          ">${data.participantName}</h2>

          <p style="
            font-size: 14px;
            color: #1a202c;
            opacity: 0.8;
            margin: 0 0 16px 0;
          ">${data.participationText || "participou do evento"}</p>

          <h3 style="
            font-size: 24px;
            font-weight: 500;
            color: ${data.primaryColor};
            margin: 12px 0;
          ">${data.eventName}</h3>

          <div style="
            font-size: 12px;
            color: #1a202c;
            opacity: 0.7;
            margin: 16px 0;
          ">
            ${data.eventDate ? `<span style="margin: 0 10px;">📅 ${data.eventDate}</span>` : ""}
            ${data.eventLocation ? `<span style="margin: 0 10px;">📍 ${data.eventLocation}</span>` : ""}
            ${data.workloadHours ? `<span style="margin: 0 10px;">⏱ ${data.workloadHours}h</span>` : ""}
          </div>

          <div style="
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            width: 100%;
            padding-top: 32px;
            border-top: 1px solid ${data.secondaryColor}40;
            margin-top: auto;
          ">
            <div style="text-align: center; flex: 1;">
              <div style="
                width: 140px;
                height: 1px;
                background: ${data.primaryColor};
                margin: 0 auto 8px;
              "></div>
              <p style="font-size: 10px; color: #1a202c; opacity: 0.6;">Assinatura do Organizador</p>
            </div>

            <div style="
              width: 70px;
              height: 70px;
              border-radius: 50%;
              background: radial-gradient(circle at 35% 35%, #d4af37, #8b6914);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              color: rgba(255,255,255,0.9);
            ">✓</div>

            <div style="text-align: center; flex: 1;">
              <p style="font-size: 9px; color: #1a202c; opacity: 0.5; letter-spacing: 0.1em;">CÓDIGO DE VERIFICAÇÃO</p>
              <p style="font-size: 11px; font-family: monospace; color: ${data.primaryColor}; margin: 4px 0;">${data.certificateCode}</p>
              ${data.qrCodeUrl ? `<img src="${data.qrCodeUrl}" style="width: 70px; height: 70px; margin-top: 8px;" />` : ""}
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * Generate PDF from certificate data without visible preview
 */
export async function generateCertificatePDFFromData(
  data: CertificatePDFData,
  filename: string = "certificado.pdf"
): Promise<void> {
  const container = createCertificateContainer(data);

  try {
    await generateCertificatePDF(container, filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
