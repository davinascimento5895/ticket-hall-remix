/**
 * Client-side PDF generation for certificates
 * Uses html2canvas + jsPDF with optimized settings for professional quality
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  // Wait for images to load (especially background cross-origin)
  const images = previewElement.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve, reject) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else if (img.complete && img.naturalWidth === 0) {
            reject(new Error(`Falha ao carregar imagem: ${img.src}`));
          } else {
            img.onload = () => {
              if (img.naturalWidth > 0) {
                resolve();
              } else {
                reject(new Error(`Falha ao carregar imagem: ${img.src}`));
              }
            };
            img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${img.src}`));
          }
        })
    )
  );

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
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Convert canvas to high quality image
  const imageData = canvas.toDataURL("image/png", 1.0);

  // Add image to PDF covering entire page
  pdf.addImage(
    imageData,
    "PNG",
    0,
    0,
    pageWidth,
    pageHeight,
    undefined,
    "MEDIUM"
  );

  // Save PDF
  pdf.save(filename);

  console.log("[PDF] Generated successfully:", filename);
}

/**
 * Generate PNG blob from certificate preview element
 */
export async function generateCertificatePNG(
  previewElement: HTMLElement,
  filename: string = "certificado.png"
): Promise<void> {
  if ("fonts" in document) {
    await (document as any).fonts?.ready;
  }

  const images = previewElement.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  const canvas = await html2canvas(previewElement, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    width: previewElement.offsetWidth,
    height: previewElement.offsetHeight,
    imageTimeout: 30000,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
