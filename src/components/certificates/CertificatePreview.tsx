import React, { memo, useEffect } from "react";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CertificateTemplateId } from "@/lib/certificates/templates";
import logoFullBlackSvg from "@/assets/logo-full-black.svg";
import logoFullWhiteSvg from "@/assets/logo-full-white.svg";

export interface CertificateFields {
  showEventName: boolean;
  showParticipantName: boolean;
  showParticipantLastName: boolean;
  showCPF: boolean;
  showEventDate: boolean;
  showEventLocation: boolean;
  showWorkload: boolean;
  showSigners: boolean;
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
  eventLocation: string;
  certificateCode: string;
}

export interface CertificatePreviewProps {
  templateId: CertificateTemplateId;
  primaryColor: string;
  secondaryColor: string;
  backgroundUrl?: string;
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  workloadHours?: number;
  sampleData: CertificateSampleData;
  className?: string;
  debounceMs?: number;
  onPreviewReady?: () => void;
}

const normalizeTemplateId = (value: unknown): CertificateTemplateId => {
  if (value === "executive" || value === "modern" || value === "academic" || value === "creative") {
    return value;
  }
  if (value === 0 || value === "0") return "executive";
  if (value === 1 || value === "1") return "modern";
  if (value === 2 || value === "2") return "academic";
  if (value === 3 || value === "3") return "creative";
  return "executive";
};

type TemplateProps = {
  primaryColor: string;
  secondaryColor: string;
  backgroundUrl?: string;
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  workloadHours?: number;
  sampleData: CertificateSampleData;
};

function Logo({ dark }: { dark?: boolean }) {
  return (
    <img
      src={dark ? logoFullWhiteSvg : logoFullBlackSvg}
      alt="TicketHall"
      className="h-8 w-auto"
      draggable={false}
    />
  );
}

function EventMeta({ fields, workloadHours, sampleData, tone = "default" }: {
  fields: CertificateFields;
  workloadHours?: number;
  sampleData: CertificateSampleData;
  tone?: "default" | "light";
}) {
  const isLight = tone === "light";
  const itemClass = isLight ? "text-white/85" : "text-slate-600";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs", itemClass)}>
      {fields.showEventDate ? (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {sampleData.eventDate}
        </span>
      ) : null}

      {fields.showEventLocation ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {sampleData.eventLocation}
        </span>
      ) : null}

      {fields.showWorkload && workloadHours ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {workloadHours}h
        </span>
      ) : null}
    </div>
  );
}

function Signers({ signers, show, colorClass = "text-slate-700", lineColor = "#cbd5e1" }: {
  signers: CertificateSigner[];
  show: boolean;
  colorClass?: string;
  lineColor?: string;
}) {
  if (!show || signers.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-8">
      {signers.map((signer, index) => (
        <div key={`${signer.name}-${index}`} className={cn("min-w-28 text-center", colorClass)}>
          <div className="mx-auto mb-2 h-px w-28" style={{ backgroundColor: lineColor }} />
          <p className="text-sm font-semibold leading-tight">{signer.name}</p>
          <p className="text-xs opacity-80">{signer.role}</p>
        </div>
      ))}
    </div>
  );
}

function FooterCode({ sampleData, light = false }: { sampleData: CertificateSampleData; light?: boolean }) {
  return (
    <div className={cn("mt-auto flex items-end justify-between pt-5 text-[10px]", light ? "text-white/80" : "text-slate-500")}> 
      <div className="flex items-center gap-1.5">
        <QrCode className="h-3.5 w-3.5" />
        <span className="font-mono">{sampleData.certificateCode}</span>
      </div>
      <span>tickethall.com.br/verificar-certificado</span>
    </div>
  );
}

function participantName(sampleData: CertificateSampleData, fields: CertificateFields): string {
  if (fields.showParticipantLastName) return sampleData.participantName;
  const [first] = sampleData.participantName.split(" ");
  return first || sampleData.participantName;
}

const ExecutiveTemplate = memo(function ExecutiveTemplate(props: TemplateProps) {
  const { primaryColor, secondaryColor, backgroundUrl, fields, textConfig, signers, workloadHours, sampleData } = props;

  return (
    <div data-testid="certificate-template-executive" className="relative h-full w-full overflow-hidden bg-[#f8f7f3]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1414 1000" preserveAspectRatio="none" aria-hidden>
        <rect x="25" y="25" width="1364" height="950" fill="none" stroke={primaryColor} strokeWidth="3" />
        <rect x="48" y="48" width="1318" height="904" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="8 6" />
        <path d="M100 100h170M100 100v170M1314 100h-170M1314 100v170M100 900h170M100 900v-170M1314 900h-170M1314 900v-170" stroke={secondaryColor} strokeWidth="4" fill="none" />
      </svg>

      {backgroundUrl ? (
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : null}

      <div className="relative z-10 flex h-full flex-col px-14 py-10 text-center text-slate-800">
        <div className="mb-5 flex items-center justify-center">
          <Logo />
        </div>

        <h2 className="text-[30px] font-semibold uppercase tracking-[0.14em]" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
          {textConfig.title || "Certificado de Participacao"}
        </h2>

        <p className="mt-2 text-sm" style={{ color: "#5b6472" }}>
          {textConfig.introText || "Certificamos que"}
        </p>

        {fields.showParticipantName ? (
          <h3 className="mt-4 text-[44px] font-semibold leading-tight" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
            {participantName(sampleData, fields)}
          </h3>
        ) : null}

        {fields.showCPF ? <p className="mt-1 text-sm text-slate-500">CPF: {sampleData.participantCPF}</p> : null}

        <p className="mt-4 text-base text-slate-600">{textConfig.participationText || "participou do evento"}</p>

        {fields.showEventName ? (
          <h4 className="mt-2 text-[28px] font-medium" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
            {sampleData.eventName}
          </h4>
        ) : null}

        <div className="mt-5">
          <EventMeta fields={fields} workloadHours={workloadHours} sampleData={sampleData} />
        </div>

        <p className="mx-auto mt-5 max-w-xl text-xs text-slate-600">
          {textConfig.conclusionText || "Comprove sua participacao atraves do codigo de verificacao."}
        </p>

        <Signers signers={signers} show={fields.showSigners} lineColor={`${primaryColor}66`} />

        <FooterCode sampleData={sampleData} />
      </div>
    </div>
  );
});

const ModernTemplate = memo(function ModernTemplate(props: TemplateProps) {
  const { primaryColor, secondaryColor, backgroundUrl, fields, textConfig, signers, workloadHours, sampleData } = props;

  return (
    <div data-testid="certificate-template-modern" className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1414 1000" preserveAspectRatio="none" aria-hidden>
        <polygon points="0,0 510,0 310,1000 0,1000" fill={primaryColor} opacity="0.92" />
        <polygon points="1414,0 1414,1000 595,1000 865,0" fill={secondaryColor} opacity="0.2" />
        <circle cx="1175" cy="170" r="130" fill="none" stroke={secondaryColor} strokeWidth="3" opacity="0.6" />
        <circle cx="1245" cy="870" r="170" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.35" />
      </svg>

      {backgroundUrl ? (
        <div className="absolute inset-0 opacity-10 mix-blend-screen" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : null}

      <div className="relative z-10 grid h-full grid-cols-[320px_1fr] gap-6 px-8 py-8">
        <div className="flex flex-col rounded-xl border border-white/20 bg-black/25 p-5 backdrop-blur-sm">
          <Logo dark />
          <p className="mt-8 text-[11px] uppercase tracking-[0.24em] text-white/70">Template Modern</p>
          <h2 className="mt-3 text-[26px] font-bold leading-tight uppercase">{textConfig.title || "Certificado"}</h2>
          <p className="mt-3 text-sm text-white/80">{textConfig.introText || "Certificamos que"}</p>
          {fields.showParticipantName ? (
            <p className="mt-6 text-[28px] font-semibold leading-tight">{participantName(sampleData, fields)}</p>
          ) : null}
          {fields.showCPF ? <p className="mt-2 text-xs text-white/70">CPF: {sampleData.participantCPF}</p> : null}
          <div className="mt-auto text-xs text-white/70">#{sampleData.certificateCode}</div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border border-white/20 bg-white/6 px-8 py-7 backdrop-blur-sm">
          <p className="text-base text-white/85">{textConfig.participationText || "participou do evento"}</p>
          {fields.showEventName ? <h3 className="mt-3 text-[36px] font-semibold leading-tight">{sampleData.eventName}</h3> : null}
          <div className="mt-5">
            <EventMeta tone="light" fields={fields} workloadHours={workloadHours} sampleData={sampleData} />
          </div>
          <p className="mt-5 max-w-xl text-sm text-white/80">
            {textConfig.conclusionText || "Comprove sua participacao atraves do codigo de verificacao."}
          </p>
          <Signers signers={signers} show={fields.showSigners} colorClass="text-white" lineColor="rgba(255,255,255,0.45)" />
          <FooterCode sampleData={sampleData} light />
        </div>
      </div>
    </div>
  );
});

const AcademicTemplate = memo(function AcademicTemplate(props: TemplateProps) {
  const { primaryColor, secondaryColor, backgroundUrl, fields, textConfig, signers, workloadHours, sampleData } = props;

  return (
    <div data-testid="certificate-template-academic" className="relative h-full w-full overflow-hidden bg-[#f5f0e6]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1414 1000" preserveAspectRatio="none" aria-hidden>
        <rect x="34" y="34" width="1346" height="932" fill="#fffaf0" stroke={secondaryColor} strokeWidth="2" />
        <rect x="74" y="74" width="1266" height="852" fill="none" stroke={primaryColor} strokeWidth="1.4" />
        <path d="M110 134h1194" stroke={secondaryColor} strokeWidth="2" opacity="0.55" />
        <path d="M110 866h1194" stroke={secondaryColor} strokeWidth="2" opacity="0.55" />
      </svg>

      {backgroundUrl ? (
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : null}

      <div className="relative z-10 flex h-full flex-col px-16 py-10 text-center text-[#2f2a24]">
        <div className="mb-1 flex items-center justify-center">
          <Logo />
        </div>

        <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: secondaryColor }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3l7 4v5c0 5-3.2 7.7-7 9-3.8-1.3-7-4-7-9V7l7-4z" stroke={primaryColor} strokeWidth="1.8" />
            <path d="M9 12l2 2 4-4" stroke={secondaryColor} strokeWidth="1.8" />
          </svg>
        </div>

        <h2 className="mt-4 text-[32px] font-semibold uppercase tracking-[0.12em]" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
          {textConfig.title || "Certificado de Participacao"}
        </h2>

        <p className="mt-2 text-sm text-[#6e6255]">{textConfig.introText || "Certificamos que"}</p>

        {fields.showParticipantName ? (
          <h3 className="mt-4 text-[42px] font-semibold leading-tight" style={{ color: primaryColor, fontFamily: "Georgia, serif" }}>
            {participantName(sampleData, fields)}
          </h3>
        ) : null}

        {fields.showCPF ? <p className="mt-1 text-xs text-[#7a6e61]">CPF: {sampleData.participantCPF}</p> : null}

        <p className="mt-4 text-base text-[#6e6255]">{textConfig.participationText || "participou do evento"}</p>

        {fields.showEventName ? (
          <h4 className="mt-2 text-[30px] font-medium" style={{ color: secondaryColor, fontFamily: "Georgia, serif" }}>
            {sampleData.eventName}
          </h4>
        ) : null}

        <div className="mt-5">
          <EventMeta fields={fields} workloadHours={workloadHours} sampleData={sampleData} />
        </div>

        <p className="mx-auto mt-4 max-w-xl text-xs text-[#6e6255]">
          {textConfig.conclusionText || "Comprove sua participacao atraves do codigo de verificacao."}
        </p>

        <Signers signers={signers} show={fields.showSigners} colorClass="text-[#3a3129]" lineColor={`${secondaryColor}88`} />

        <FooterCode sampleData={sampleData} />
      </div>
    </div>
  );
});

const CreativeTemplate = memo(function CreativeTemplate(props: TemplateProps) {
  const { primaryColor, secondaryColor, backgroundUrl, fields, textConfig, signers, workloadHours, sampleData } = props;

  return (
    <div data-testid="certificate-template-creative" className="relative h-full w-full overflow-hidden bg-[#fffdf8]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1414 1000" preserveAspectRatio="none" aria-hidden>
        <path d="M0 186 C212 57 466 114 594 214 C734 329 904 300 1074 200 C1216 114 1314 71 1414 100 L1414 0 L0 0 Z" fill={primaryColor} opacity="0.14" />
        <path d="M0 1000 L0 743 C226 614 424 671 594 800 C790 943 974 914 1186 771 C1300 700 1364 671 1414 689 L1414 1000 Z" fill={secondaryColor} opacity="0.2" />
        <circle cx="240" cy="829" r="100" fill={primaryColor} opacity="0.25" />
        <circle cx="1188" cy="171" r="68" fill={secondaryColor} opacity="0.3" />
      </svg>

      {backgroundUrl ? (
        <div className="absolute inset-0 opacity-14" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : null}

      <div className="relative z-10 flex h-full items-center justify-center px-12 py-8">
        <div className="grid h-full w-full max-w-[900px] grid-cols-[1.08fr_0.92fr] gap-5 rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-5">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full" style={{ backgroundColor: `${primaryColor}24` }} />
            <div className="relative z-10 flex items-center justify-between">
              <Logo />
              <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: `${secondaryColor}2e`, color: "#1f2937" }}>
                Creative
              </span>
            </div>

            <h2 className="mt-6 text-[30px] font-black uppercase leading-none tracking-[0.06em]" style={{ color: primaryColor }}>
              {textConfig.title || "Certificado"}
            </h2>

            <p className="mt-4 text-sm text-slate-600">{textConfig.introText || "Certificamos que"}</p>

            {fields.showParticipantName ? (
              <h3 className="mt-3 text-[38px] font-bold leading-[1.05] text-slate-900">{participantName(sampleData, fields)}</h3>
            ) : null}

            {fields.showCPF ? <p className="mt-1 text-xs text-slate-500">CPF: {sampleData.participantCPF}</p> : null}

            <p className="mt-4 text-base text-slate-700">{textConfig.participationText || "participou do evento"}</p>
            {fields.showEventName ? <h4 className="mt-2 text-2xl font-semibold text-slate-900">{sampleData.eventName}</h4> : null}
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
            <div className="rounded-xl p-4" style={{ background: `linear-gradient(120deg, ${primaryColor}22, ${secondaryColor}33)` }}>
              <EventMeta fields={fields} workloadHours={workloadHours} sampleData={sampleData} />
            </div>

            <p className="mt-5 text-sm text-slate-600">
              {textConfig.conclusionText || "Comprove sua participacao atraves do codigo de verificacao."}
            </p>

            <Signers signers={signers} show={fields.showSigners} lineColor={`${primaryColor}70`} />

            <FooterCode sampleData={sampleData} />
          </div>
        </div>
      </div>
    </div>
  );
});

export const CertificatePreview = memo(function CertificatePreview({
  templateId,
  primaryColor,
  secondaryColor,
  backgroundUrl,
  fields,
  textConfig,
  signers,
  workloadHours,
  sampleData,
  className,
  onPreviewReady,
}: CertificatePreviewProps) {
  const effectiveTemplateId = normalizeTemplateId(templateId);

  useEffect(() => {
    onPreviewReady?.();
  }, [onPreviewReady, effectiveTemplateId, primaryColor, secondaryColor, backgroundUrl, fields, textConfig, signers, workloadHours, sampleData]);

  const templateProps: TemplateProps = {
    primaryColor,
    secondaryColor,
    backgroundUrl,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  };

  return (
    <div
      data-testid="certificate-preview"
      data-template-id={effectiveTemplateId}
      className={cn(
        "certificate-preview relative overflow-hidden rounded-xl border bg-white shadow-sm mx-auto",
        className
      )}
    >
      {effectiveTemplateId === "modern" ? <ModernTemplate {...templateProps} /> : null}
      {effectiveTemplateId === "academic" ? <AcademicTemplate {...templateProps} /> : null}
      {effectiveTemplateId === "creative" ? <CreativeTemplate {...templateProps} /> : null}
      {effectiveTemplateId === "executive" ? <ExecutiveTemplate {...templateProps} /> : null}
    </div>
  );
});
