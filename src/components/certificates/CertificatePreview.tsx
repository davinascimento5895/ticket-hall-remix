import React, { memo } from "react";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CertificateFields {
  showEventName: boolean;
  showParticipantName: boolean;
  showParticipantLastName: boolean;
  showCPF: boolean;
  maskCPF?: boolean;
  showEventDate: boolean;
  showEventTime?: boolean;
  showEventLocation: boolean;
  showWorkload: boolean;
  showSigners: boolean;
  showQRCode?: boolean;
}

export interface CertificateTextConfig {
  title: string;
  introText: string;
  participationText: string;
  conclusionText: string;
}

export interface CertificateSigner {
  name: string;
  role: string;
  signatureUrl?: string;
}

export interface CertificateSampleData {
  eventName: string;
  participantName: string;
  participantCPF: string;
  eventDate: string;
  eventTime?: string;
  eventLocation: string;
  certificateCode: string;
}

export interface CertificateTextPositions {
  titleTop: number;
  nameTop: number;
  metadataTop: number;
}

export interface CertificateFontSizes {
  title: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  name: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  event: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
}

export interface CertificatePreviewProps {
  backgroundUrl?: string;
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  workloadHours?: number;
  sampleData: CertificateSampleData;
  textColor?: string;
  textPositions?: CertificateTextPositions;
  fontSizes?: CertificateFontSizes;
  className?: string;
  onPreviewReady?: () => void;
  mode?: "producer" | "production";
}

const DEFAULT_POSITIONS: CertificateTextPositions = {
  titleTop: 8,
  nameTop: 28,
  metadataTop: 55,
};

const DEFAULT_FONT_SIZES: CertificateFontSizes = {
  title: "xl",
  name: "4xl",
  event: "2xl",
};

function participantName(sampleData: CertificateSampleData, fields: CertificateFields): string {
  if (fields.showParticipantLastName) return sampleData.participantName;
  const [first] = sampleData.participantName.split(" ");
  return first || sampleData.participantName;
}

function getFontSizeClass(size: string, type: "title" | "name" | "event"): string {
  const map: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
  };
  return map[size] || (type === "name" ? "text-4xl" : type === "event" ? "text-2xl" : "text-xl");
}

export const CertificatePreview = memo(function CertificatePreview({
  backgroundUrl,
  fields,
  textConfig,
  signers,
  workloadHours,
  sampleData,
  textColor = "#1f2937",
  textPositions = DEFAULT_POSITIONS,
  fontSizes = DEFAULT_FONT_SIZES,
  className,
  onPreviewReady,
  mode = "producer",
}: CertificatePreviewProps) {
  React.useEffect(() => {
    onPreviewReady?.();
  }, [onPreviewReady]);

  const name = participantName(sampleData, fields);
  const effectiveTextColor = textColor;

  const titleClass = cn("font-semibold uppercase tracking-wider text-center", getFontSizeClass(fontSizes.title, "title"));
  const nameClass = cn("font-bold leading-tight text-center", getFontSizeClass(fontSizes.name, "name"));
  const eventClass = cn("font-semibold leading-tight text-center", getFontSizeClass(fontSizes.event, "event"));

  return (
    <div
      data-testid="certificate-preview"
      className={cn(
        "certificate-preview relative overflow-hidden rounded-xl border bg-white shadow-sm mx-auto",
        className
      )}
      style={{ aspectRatio: "297/210", maxWidth: "100%" }}
    >
      {/* Background Image Layer */}
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
          crossOrigin="anonymous"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center" style={{ zIndex: 0 }}>
          <p className="text-sm text-slate-400">Nenhuma imagem de fundo selecionada</p>
        </div>
      )}

      {/* Text Overlay Layer */}
      <div
        className="absolute inset-0 flex flex-col px-[6%] py-[4%]"
        style={{ zIndex: 10, color: effectiveTextColor }}
      >
        {/* Title */}
        <div style={{ marginTop: `${textPositions.titleTop}%` }} className="flex-shrink-0">
          {textConfig.title ? (
            <h1 className={titleClass} style={{ color: effectiveTextColor }}>
              {textConfig.title}
            </h1>
          ) : null}
          {textConfig.introText ? (
            <p className="text-center text-sm sm:text-base mt-1 opacity-90" style={{ color: effectiveTextColor }}>
              {textConfig.introText}
            </p>
          ) : null}
        </div>

        {/* Participant Name */}
        {fields.showParticipantName ? (
          <div style={{ marginTop: `${Math.max(2, textPositions.nameTop - textPositions.titleTop)}%` }} className="flex-shrink-0">
            <h2 className={nameClass} style={{ color: effectiveTextColor }}>
              {name}
            </h2>
            {fields.showCPF && sampleData.participantCPF ? (
              <p className="text-center text-xs sm:text-sm mt-1 opacity-80" style={{ color: effectiveTextColor }}>
                CPF: {fields.maskCPF
                  ? sampleData.participantCPF.replace(/^(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})$/, "***.$2.$3-$4")
                  : sampleData.participantCPF}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Event & Participation */}
        {fields.showEventName || textConfig.participationText ? (
          <div style={{ marginTop: `${Math.max(2, textPositions.metadataTop - (fields.showParticipantName ? textPositions.nameTop : textPositions.titleTop))}%` }} className="flex-shrink-0">
            {textConfig.participationText ? (
              <p className="text-center text-sm sm:text-base opacity-90" style={{ color: effectiveTextColor }}>
                {textConfig.participationText}
              </p>
            ) : null}
            {fields.showEventName ? (
              <h3 className={cn(eventClass, "mt-1")} style={{ color: effectiveTextColor }}>
                {sampleData.eventName}
              </h3>
            ) : null}
          </div>
        ) : null}

        {/* Metadata row */}
        <div className="flex-shrink-0 mt-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs opacity-85">
            {fields.showEventDate && sampleData.eventDate ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sampleData.eventDate}
              </span>
            ) : null}
            {fields.showEventTime && sampleData.eventTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {sampleData.eventTime}
              </span>
            ) : null}
            {fields.showEventLocation && sampleData.eventLocation ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {sampleData.eventLocation}
              </span>
            ) : null}
            {fields.showWorkload && workloadHours != null ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {workloadHours}h
              </span>
            ) : null}
          </div>
        </div>

        {/* Conclusion text */}
        {textConfig.conclusionText ? (
          <p className="text-center text-[10px] sm:text-xs mt-2 max-w-[80%] mx-auto opacity-80" style={{ color: effectiveTextColor }}>
            {textConfig.conclusionText}
          </p>
        ) : null}

        {/* Spacer to push footer down */}
        <div className="flex-1 min-h-[8px]" />

        {/* Signers */}
        {fields.showSigners && signers.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2">
            {signers.map((signer, index) => (
              <div key={`${signer.name}-${index}`} className="min-w-[80px] sm:min-w-28 text-center">
                {signer.signatureUrl ? (
                  <img
                    src={signer.signatureUrl}
                    alt=""
                    className="h-6 sm:h-8 w-auto mx-auto mb-1 object-contain"
                    style={{ filter: effectiveTextColor === "#ffffff" || effectiveTextColor === "#fff" ? "invert(1)" : "none" }}
                  />
                ) : (
                  <div className="mx-auto mb-1 h-px w-16 sm:w-24 bg-current opacity-40" />
                )}
                <p className="text-[10px] sm:text-xs font-semibold leading-tight">{signer.name}</p>
                <p className="text-[9px] sm:text-[10px] opacity-80">{signer.role}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Footer: QR + Code + URL */}
        <div className="flex flex-wrap items-end justify-between gap-2 pt-2 mt-2 text-[9px] sm:text-[10px] opacity-80">
          <div className="flex items-center gap-1 min-w-0">
            {fields.showQRCode !== false && <QrCode className="h-3 w-3 flex-shrink-0 mr-1" />}
            <span className="font-mono truncate">{sampleData.certificateCode}</span>
          </div>
          <span className="truncate">tickethall.com.br/verificar-certificado</span>
        </div>
      </div>
    </div>
  );
});
