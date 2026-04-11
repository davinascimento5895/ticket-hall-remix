/**
 * CertificatePreview Component
 * 
 * High-performance real-time certificate preview with:
 * - React.memo for render optimization
 * - Debounced updates (500ms)
 * - useMemo for expensive computations
 * - CSS transforms for smooth animations
 * - Lazy-loaded background images
 * - A4 landscape aspect ratio
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Award, Calendar, MapPin, Clock, User, FileText, CheckCircle2, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CERTIFICATE_TEMPLATES,
  ColorUtils,
  type CertificateTemplateId,
} from '@/lib/certificates/templates';

// =============================================================================
// Types & Interfaces
// =============================================================================

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
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** Callback when preview is ready */
  onPreviewReady?: () => void;
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Custom hook for debouncing values
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for lazy loading background images
 */
function useLazyBackground(imageUrl: string | undefined): {
  loaded: boolean;
  backgroundStyle: React.CSSProperties;
} {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setLoaded(false);
      return;
    }

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  const backgroundStyle = useMemo<React.CSSProperties>(() => {
    if (!imageUrl) return {};
    
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: loaded ? 1 : 0,
      transition: 'opacity 300ms ease-out',
    };
  }, [imageUrl, loaded]);

  return { loaded, backgroundStyle };
}

// =============================================================================
// Sub-Components (Memoized)
// =============================================================================

interface CornerDecorationProps {
  style: 'classic' | 'modern' | 'minimal' | 'ornate';
  primaryColor: string;
  secondaryColor: string;
}

/**
 * Corner decorations - memoized to prevent re-renders
 */
const CornerDecorations = React.memo<CornerDecorationProps>(function CornerDecorations({
  style,
  primaryColor,
  secondaryColor,
}) {
  const corners = useMemo(() => {
    const basePositions = [
      { position: 'top-0 left-0', h: 'w-16 h-1.5', v: 'w-1.5 h-16' },
      { position: 'top-0 right-0', h: 'w-16 h-1.5', v: 'w-1.5 h-16' },
      { position: 'bottom-0 left-0', h: 'w-16 h-1.5', v: 'w-1.5 h-16' },
      { position: 'bottom-0 right-0', h: 'w-16 h-1.5', v: 'w-1.5 h-16' },
    ];

    if (style === 'minimal') return null;

    return basePositions.map((corner, index) => (
      <React.Fragment key={index}>
        <div
          className={cn('absolute', corner.position)}
          style={{
            transform: style === 'ornate' ? 'scale(1.3)' : undefined,
          }}
        >
          <div
            className={cn(corner.h)}
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className={cn(corner.v)}
            style={{ backgroundColor: style === 'ornate' ? secondaryColor : primaryColor }}
          />
        </div>
      </React.Fragment>
    ));
  }, [style, primaryColor, secondaryColor]);

  if (style === 'minimal') return null;

  return <>{corners}</>;
});

interface SignerSectionProps {
  signers: CertificateSigner[];
  layout: 'row' | 'column' | 'grid';
  primaryColor: string;
  secondaryColor: string;
}

/**
 * Signers section - memoized to prevent re-renders
 */
const SignersSection = React.memo<SignerSectionProps>(function SignersSection({
  signers,
  layout,
  primaryColor,
  secondaryColor,
}) {
  const containerClasses = useMemo(() => {
    switch (layout) {
      case 'column':
        return 'flex flex-col items-center gap-6';
      case 'grid':
        return 'grid grid-cols-2 gap-6';
      case 'row':
      default:
        return 'flex flex-row justify-center gap-8 flex-wrap';
    }
  }, [layout]);

  if (signers.length === 0) return null;

  return (
    <div className={cn('mt-6', containerClasses)}>
      {signers.map((signer, index) => (
        <div
          key={`${signer.name}-${index}`}
          className="flex flex-col items-center text-center"
          style={{ minWidth: '120px' }}
        >
          {/* Signature Line */}
          <div
            className="w-32 h-px mb-2"
            style={{ backgroundColor: primaryColor }}
          />
          
          {/* Signature Image or Placeholder */}
          {signer.signatureUrl ? (
            <img
              src={signer.signatureUrl}
              alt={`Assinatura de ${signer.name}`}
              className="h-12 object-contain mb-1"
              loading="lazy"
            />
          ) : (
            <div
              className="h-8 w-24 border-b-2 border-dashed mb-2"
              style={{ borderColor: secondaryColor, opacity: 0.5 }}
            />
          )}
          
          {/* Signer Name */}
          <span
            className="text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            {signer.name}
          </span>
          
          {/* Signer Role */}
          <span
            className="text-xs"
            style={{ color: secondaryColor }}
          >
            {signer.role}
          </span>
        </div>
      ))}
    </div>
  );
});

interface QRCodeSectionProps {
  certificateCode: string;
  position: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

/**
 * QR Code placeholder section - memoized
 */
const QRCodeSection = React.memo<QRCodeSectionProps>(function QRCodeSection({
  certificateCode,
  position,
}) {
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'bottom-left':
        return 'absolute bottom-4 left-4';
      case 'bottom-center':
        return 'absolute bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'absolute bottom-4 right-4';
    }
  }, [position]);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded bg-white/80 backdrop-blur-sm',
        positionClasses
      )}
      style={{ willChange: 'transform' }}
    >
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
        <QrCode className="w-10 h-10 text-gray-400" />
      </div>
      <span className="text-[9px] text-gray-500 font-mono truncate max-w-[80px]">
        {certificateCode.slice(-8)}
      </span>
    </div>
  );
});

// =============================================================================
// Template Renderers (Memoized Components)
// =============================================================================

interface TemplateRendererProps {
  templateId: CertificateTemplateId;
  cssVariables: Record<string, string>;
  backgroundStyle: React.CSSProperties;
  primaryColor: string;
  secondaryColor: string;
  fields: CertificateFields;
  textConfig: CertificateTextConfig;
  signers: CertificateSigner[];
  workloadHours?: number;
  sampleData: CertificateSampleData;
}

/**
 * Executive template renderer
 */
const ExecutiveTemplate = React.memo<TemplateRendererProps>(function ExecutiveTemplate(props) {
  const {
    cssVariables,
    backgroundStyle,
    primaryColor,
    secondaryColor,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  } = props;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        ...cssVariables,
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #fafafa 100%)',
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={backgroundStyle}
      />

      {/* Corner Decorations */}
      <CornerDecorations
        style="classic"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Inner Border */}
      <div
        className="absolute inset-6 border pointer-events-none"
        style={{ borderColor: `${primaryColor}20` }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-12 py-8 text-center">
        {/* Header Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Award className="w-8 h-8" style={{ color: primaryColor }} />
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold tracking-wider mb-2"
          style={{ color: primaryColor, fontFamily: 'Georgia, serif' }}
        >
          {textConfig.title}
        </h1>

        {/* Decorative Line */}
        <div
          className="w-32 h-0.5 mb-6"
          style={{ backgroundColor: secondaryColor }}
        />

        {/* Intro Text */}
        <p className="text-base text-gray-600 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          {textConfig.introText}
        </p>

        {/* Participant Name */}
        {fields.showParticipantName && (
          <h2
            className="text-xl md:text-2xl font-bold mb-3"
            style={{ color: primaryColor, fontFamily: 'Georgia, serif' }}
          >
            {fields.showParticipantLastName
              ? `${sampleData.participantName} Santos`
              : sampleData.participantName}
            {fields.showCPF && (
              <span className="block text-sm font-normal text-gray-500 mt-1">
                CPF: {sampleData.participantCPF}
              </span>
            )}
          </h2>
        )}

        {/* Participation Text */}
        <p className="text-base text-gray-600 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          {textConfig.participationText}
        </p>

        {/* Event Name */}
        {fields.showEventName && (
          <h3
            className="text-lg md:text-xl font-semibold mb-4 max-w-2xl"
            style={{ color: primaryColor }}
          >
            {sampleData.eventName}
          </h3>
        )}

        {/* Event Details */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 mb-4">
          {fields.showEventDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{sampleData.eventDate}</span>
            </div>
          )}
          {fields.showEventLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{sampleData.eventLocation}</span>
            </div>
          )}
          {fields.showWorkload && workloadHours && workloadHours > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{workloadHours} horas</span>
            </div>
          )}
        </div>

        {/* Conclusion Text */}
        <p
          className="text-sm text-gray-600 max-w-xl mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {textConfig.conclusionText}
        </p>

        {/* Signers */}
        {fields.showSigners && signers.length > 0 && (
          <SignersSection
            signers={signers}
            layout="row"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-8" />

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono">{sampleData.certificateCode}</span>
          </div>
          <span>tickethall.com.br</span>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSection
        certificateCode={sampleData.certificateCode}
        position="bottom-right"
      />
    </div>
  );
});

/**
 * Modern template renderer
 */
const ModernTemplate = React.memo<TemplateRendererProps>(function ModernTemplate(props) {
  const {
    cssVariables,
    backgroundStyle,
    primaryColor,
    secondaryColor,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  } = props;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        ...cssVariables,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={backgroundStyle}
      />

      {/* Side Accent Bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Corner Decorations */}
      <CornerDecorations
        style="modern"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col px-10 py-8 pl-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {textConfig.title}
            </h1>
            <div
              className="w-16 h-1 rounded-full mt-1"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Intro */}
          <p className="text-gray-600 mb-2">{textConfig.introText}</p>

          {/* Participant */}
          {fields.showParticipantName && (
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {fields.showParticipantLastName
                ? `${sampleData.participantName} Santos`
                : sampleData.participantName}
            </h2>
          )}

          {/* Participation */}
          <p className="text-gray-600 mb-3">{textConfig.participationText}</p>

          {/* Event */}
          {fields.showEventName && (
            <h3
              className="text-xl font-semibold mb-6"
              style={{ color: primaryColor }}
            >
              {sampleData.eventName}
            </h3>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {fields.showEventDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" style={{ color: secondaryColor }} />
                <span>{sampleData.eventDate}</span>
              </div>
            )}
            {fields.showEventLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" style={{ color: secondaryColor }} />
                <span>{sampleData.eventLocation}</span>
              </div>
            )}
            {fields.showWorkload && workloadHours && workloadHours > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
                <span>{workloadHours}h</span>
              </div>
            )}
          </div>

          {/* CPF */}
          {fields.showCPF && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <User className="w-4 h-4" />
              <span>CPF: {sampleData.participantCPF}</span>
            </div>
          )}

          {/* Conclusion */}
          <p className="text-sm text-gray-600 max-w-xl">
            {textConfig.conclusionText}
          </p>
        </div>

        {/* Signers */}
        {fields.showSigners && signers.length > 0 && (
          <SignersSection
            signers={signers}
            layout="row"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono">{sampleData.certificateCode}</span>
          </div>
          <span>tickethall.com.br</span>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSection
        certificateCode={sampleData.certificateCode}
        position="bottom-right"
      />
    </div>
  );
});

/**
 * Academic template renderer
 */
const AcademicTemplate = React.memo<TemplateRendererProps>(function AcademicTemplate(props) {
  const {
    cssVariables,
    backgroundStyle,
    primaryColor,
    secondaryColor,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  } = props;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        ...cssVariables,
        background: 'linear-gradient(180deg, #fffef8 0%, #fff9e6 100%)',
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={backgroundStyle}
      />

      {/* Ornate Border */}
      <div
        className="absolute inset-3 border-4 pointer-events-none"
        style={{ borderColor: `${primaryColor}30` }}
      />
      <div
        className="absolute inset-5 border pointer-events-none"
        style={{ borderColor: `${secondaryColor}40` }}
      />

      {/* Corner Decorations */}
      <CornerDecorations
        style="ornate"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-12 py-8 text-center">
        {/* Decorative Top Element */}
        <div className="mb-4">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4"
            style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}10` }}
          >
            <Award className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold tracking-wide mb-2"
          style={{ color: primaryColor, fontFamily: 'Georgia, Times, serif' }}
        >
          {textConfig.title}
        </h1>

        {/* Decorative Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-16 h-px"
            style={{ backgroundColor: secondaryColor }}
          />
          <div
            className="w-2 h-2 rotate-45"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="w-16 h-px"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>

        {/* Intro */}
        <p
          className="text-lg text-gray-700 mb-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {textConfig.introText}
        </p>

        {/* Participant */}
        {fields.showParticipantName && (
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: primaryColor, fontFamily: 'Georgia, serif' }}
          >
            {fields.showParticipantLastName
              ? `${sampleData.participantName} Santos`
              : sampleData.participantName}
          </h2>
        )}

        {fields.showCPF && (
          <p className="text-sm text-gray-500 mb-4">
            CPF: {sampleData.participantCPF}
          </p>
        )}

        {/* Participation */}
        <p
          className="text-lg text-gray-700 mb-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {textConfig.participationText}
        </p>

        {/* Event */}
        {fields.showEventName && (
          <h3
            className="text-xl font-semibold mb-4 max-w-2xl"
            style={{ color: primaryColor }}
          >
            {sampleData.eventName}
          </h3>
        )}

        {/* Details */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mb-4">
          {fields.showEventDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: secondaryColor }} />
              <span style={{ fontFamily: 'Georgia, serif' }}>{sampleData.eventDate}</span>
            </div>
          )}
          {fields.showEventLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: secondaryColor }} />
              <span style={{ fontFamily: 'Georgia, serif' }}>{sampleData.eventLocation}</span>
            </div>
          )}
          {fields.showWorkload && workloadHours && workloadHours > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
              <span style={{ fontFamily: 'Georgia, serif' }}>Carga horária: {workloadHours}h</span>
            </div>
          )}
        </div>

        {/* Conclusion */}
        <p
          className="text-sm text-gray-600 max-w-xl mb-6"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {textConfig.conclusionText}
        </p>

        {/* Signers Grid */}
        {fields.showSigners && signers.length > 0 && (
          <SignersSection
            signers={signers}
            layout="grid"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <div
          className="w-full flex items-center justify-between text-xs pt-4 border-t"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <div className="flex items-center gap-1.5" style={{ color: primaryColor }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono">{sampleData.certificateCode}</span>
          </div>
          <span style={{ color: secondaryColor }}>tickethall.com.br</span>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSection
        certificateCode={sampleData.certificateCode}
        position="bottom-center"
      />
    </div>
  );
});

/**
 * Creative template renderer
 */
const CreativeTemplate = React.memo<TemplateRendererProps>(function CreativeTemplate(props) {
  const {
    cssVariables,
    backgroundStyle,
    primaryColor,
    secondaryColor,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  } = props;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        ...cssVariables,
        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #faf5ff 100%)',
      }}
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={backgroundStyle}
      />

      {/* Decorative Shapes */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20"
        style={{ backgroundColor: secondaryColor }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Corner Decorations */}
      <CornerDecorations
        style="modern"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-10 py-8 text-center">
        {/* Top Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Award className="w-5 h-5" style={{ color: primaryColor }} />
          <span
            className="text-sm font-semibold"
            style={{ color: primaryColor }}
          >
            Certificado Oficial
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold mb-6"
          style={{ color: primaryColor }}
        >
          {textConfig.title}
        </h1>

        {/* Content Card */}
        <div
          className="w-full max-w-2xl rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)' }}
        >
          {/* Intro */}
          <p className="text-gray-600 mb-2">{textConfig.introText}</p>

          {/* Participant */}
          {fields.showParticipantName && (
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: primaryColor }}
            >
              {fields.showParticipantLastName
                ? `${sampleData.participantName} Santos`
                : sampleData.participantName}
            </h2>
          )}

          {fields.showCPF && (
            <p className="text-xs text-gray-500 mb-3">
              CPF: {sampleData.participantCPF}
            </p>
          )}

          {/* Participation */}
          <p className="text-gray-600 mb-2">{textConfig.participationText}</p>

          {/* Event */}
          {fields.showEventName && (
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: primaryColor }}
            >
              {sampleData.eventName}
            </h3>
          )}

          {/* Details */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {fields.showEventDate && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${secondaryColor}20` }}
              >
                <Calendar className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                <span style={{ color: primaryColor }}>{sampleData.eventDate}</span>
              </div>
            )}
            {fields.showEventLocation && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${secondaryColor}20` }}
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                <span style={{ color: primaryColor }}>{sampleData.eventLocation}</span>
              </div>
            )}
            {fields.showWorkload && workloadHours && workloadHours > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${secondaryColor}20` }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                <span style={{ color: primaryColor }}>{workloadHours}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Conclusion */}
        <p className="text-sm text-gray-600 max-w-xl mb-4">
          {textConfig.conclusionText}
        </p>

        {/* Signers */}
        {fields.showSigners && signers.length > 0 && (
          <SignersSection
            signers={signers}
            layout="column"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-xs text-gray-500 pt-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
            <span className="font-mono">{sampleData.certificateCode}</span>
          </div>
          <span>tickethall.com.br</span>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSection
        certificateCode={sampleData.certificateCode}
        position="bottom-right"
      />
    </div>
  );
});

/**
 * Custom template renderer
 */
const CustomTemplate = React.memo<TemplateRendererProps>(function CustomTemplate(props) {
  const {
    cssVariables,
    backgroundStyle,
    primaryColor,
    secondaryColor,
    fields,
    textConfig,
    signers,
    workloadHours,
    sampleData,
  } = props;

  // Custom template uses a flexible layout that adapts to custom colors
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        ...cssVariables,
        backgroundColor: '#ffffff',
        ...backgroundStyle,
      }}
    >
      {/* Border Frame */}
      <div
        className="absolute inset-4 border-2 pointer-events-none rounded-lg"
        style={{ borderColor: `${primaryColor}40` }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-10 py-8 text-center">
        {/* Title */}
        <h1
          className="text-2xl font-bold tracking-wide mb-6"
          style={{ color: primaryColor }}
        >
          {textConfig.title}
        </h1>

        {/* Intro */}
        <p className="text-base text-gray-600 mb-3">{textConfig.introText}</p>

        {/* Participant */}
        {fields.showParticipantName && (
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: primaryColor }}
          >
            {fields.showParticipantLastName
              ? `${sampleData.participantName} Santos`
              : sampleData.participantName}
          </h2>
        )}

        {fields.showCPF && (
          <p className="text-sm text-gray-500 mb-3">
            CPF: {sampleData.participantCPF}
          </p>
        )}

        {/* Participation */}
        <p className="text-base text-gray-600 mb-3">{textConfig.participationText}</p>

        {/* Event */}
        {fields.showEventName && (
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: primaryColor }}
          >
            {sampleData.eventName}
          </h3>
        )}

        {/* Details */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 mb-4">
          {fields.showEventDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{sampleData.eventDate}</span>
            </div>
          )}
          {fields.showEventLocation && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{sampleData.eventLocation}</span>
            </div>
          )}
          {fields.showWorkload && workloadHours && workloadHours > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>{workloadHours} horas</span>
            </div>
          )}
        </div>

        {/* Conclusion */}
        <p className="text-sm text-gray-600 max-w-xl mb-6">
          {textConfig.conclusionText}
        </p>

        {/* Signers */}
        {fields.showSigners && signers.length > 0 && (
          <SignersSection
            signers={signers}
            layout="row"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <div
          className="w-full flex items-center justify-between text-xs text-gray-400 pt-4 border-t"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono">{sampleData.certificateCode}</span>
          </div>
          <span>tickethall.com.br</span>
        </div>
      </div>

      {/* QR Code */}
      <QRCodeSection
        certificateCode={sampleData.certificateCode}
        position="bottom-right"
      />
    </div>
  );
});

// =============================================================================
// Main Component
// =============================================================================

/**
 * CertificatePreview - High-performance certificate preview component
 * 
 * Features:
 * - Debounced updates (500ms default)
 * - Memoized computations
 * - Lazy-loaded background images
 * - CSS transforms for smooth animations
 * - A4 landscape aspect ratio (297:210)
 */
export const CertificatePreview = React.memo<CertificatePreviewProps>(function CertificatePreview({
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
  debounceMs = 50,
  onPreviewReady,
}) {
  // Debounce visual props to prevent rapid re-renders during drag/typing
  // Note: templateId is NOT debounced - it's a discrete click action
  const debouncedPrimaryColor = useDebounce(primaryColor, debounceMs);
  const debouncedSecondaryColor = useDebounce(secondaryColor, debounceMs);
  const debouncedBackgroundUrl = useDebounce(backgroundUrl, debounceMs);
  const debouncedFields = useDebounce(fields, debounceMs);
  const debouncedTextConfig = useDebounce(textConfig, debounceMs);
  const debouncedSigners = useDebounce(signers, debounceMs);
  const debouncedWorkloadHours = useDebounce(workloadHours, debounceMs);
  const debouncedSampleData = useDebounce(sampleData, debounceMs);

  // Lazy load background image
  const { loaded: bgLoaded, backgroundStyle } = useLazyBackground(debouncedBackgroundUrl);

  // Get template configuration (use templateId directly - NOT debounced)
  const template = useMemo(() => {
    return CERTIFICATE_TEMPLATES[templateId] || CERTIFICATE_TEMPLATES.executive;
  }, [templateId]);

  // Generate CSS variables for theming (use templateId directly for instant updates)
  const cssVariables = useMemo(() => {
    return ColorUtils.generateCssVariables(
      debouncedPrimaryColor,
      debouncedSecondaryColor
    );
  }, [debouncedPrimaryColor, debouncedSecondaryColor]);

  // Memoize template props to prevent unnecessary re-renders
  // Use templateId directly (not debounced) for instant template switching
  const templateProps = useMemo<TemplateRendererProps>(() => ({
    templateId,
    cssVariables,
    backgroundStyle,
    primaryColor: debouncedPrimaryColor,
    secondaryColor: debouncedSecondaryColor,
    fields: debouncedFields,
    textConfig: debouncedTextConfig,
    signers: debouncedSigners,
    workloadHours: debouncedWorkloadHours,
    sampleData: debouncedSampleData,
  }), [
    templateId,
    cssVariables,
    backgroundStyle,
    debouncedPrimaryColor,
    debouncedSecondaryColor,
    debouncedFields,
    debouncedTextConfig,
    debouncedSigners,
    debouncedWorkloadHours,
    debouncedSampleData,
  ]);

  // Notify when preview is ready
  useEffect(() => {
    onPreviewReady?.();
  }, [onPreviewReady, templateProps]);

  // Render the appropriate template (use templateId directly - NOT debounced)
  const renderTemplate = useCallback(() => {
    switch (templateId) {
      case 'executive':
        return <ExecutiveTemplate {...templateProps} />;
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'academic':
        return <AcademicTemplate {...templateProps} />;
      case 'creative':
        return <CreativeTemplate {...templateProps} />;
      case 'custom':
        return <CustomTemplate {...templateProps} />;
      default:
        return <ExecutiveTemplate {...templateProps} />;
    }
  }, [templateId, templateProps]);

  return (
    <div
      className={cn(
        'relative w-full',
        'bg-white rounded-lg shadow-lg overflow-hidden',
        className
      )}
      style={{
        // A4 Landscape aspect ratio: 297:210 ≈ 1.414:1
        aspectRatio: '297/210',
        willChange: 'transform',
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
    >
      {/* Loading Overlay */}
      {debouncedBackgroundUrl && !bgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${debouncedPrimaryColor}40`, borderTopColor: 'transparent' }}
            />
            <span className="text-xs text-gray-400">Carregando...</span>
          </div>
        </div>
      )}

      {/* Certificate Content */}
      <div
        className="absolute inset-0"
        style={{
          opacity: debouncedBackgroundUrl && !bgLoaded ? 0 : 1,
          transition: 'opacity 200ms ease-out',
        }}
      >
        {renderTemplate()}
      </div>
    </div>
  );
});

// =============================================================================
// Export Types
// =============================================================================

export type {
  CertificateTemplateId,
  CertificateTemplate,
};

export { CERTIFICATE_TEMPLATES, ColorUtils };

// Default export
export default CertificatePreview;
