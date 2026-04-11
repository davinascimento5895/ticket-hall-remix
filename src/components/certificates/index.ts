/**
 * Certificate Configuration Components
 * 
 * Comprehensive UI components for configuring certificates in the producer panel.
 */

// Template Selection
export { TemplateSelector } from "./TemplateSelector";
export type { TemplateSelectorProps } from "./TemplateSelector";

// Color Configuration
export { ColorConfigurator } from "./ColorConfigurator";
export type { ColorConfiguratorProps } from "./ColorConfigurator";

// Field Configuration
export { FieldConfigurator } from "./FieldConfigurator";
export type { FieldConfiguratorProps } from "./FieldConfigurator";

// Text Configuration
export { TextConfigurator } from "./TextConfigurator";
export type { TextConfiguratorProps } from "./TextConfigurator";

// Signers Management
export { SignersManager } from "./SignersManager";
export type { Signer, SignersManagerProps } from "./SignersManager";

// Background Upload
export { BackgroundUploader } from "./BackgroundUploader";
export type { BackgroundUploaderProps } from "./BackgroundUploader";

// LinkedIn Integration
export { LinkedInIntegration } from "./LinkedInIntegration";
export type { LinkedInIntegrationProps } from "./LinkedInIntegration";

// Certificate Preview (existing)
export {
  CertificatePreview,
  type CertificatePreviewProps,
  type CertificateFields,
  type CertificateTextConfig,
  type CertificateSigner,
  type CertificateSampleData,
} from "./CertificatePreview";

// Re-export types from templates
export type {
  CertificateTemplate,
  CertificateTemplateId,
  CertificateColors,
  CertificateConfig,
  CertificateData,
} from "@/lib/certificates/templates";
export {
  CERTIFICATE_TEMPLATES,
  getCertificateTemplate,
  getTemplateDefaultColors,
  DEFAULT_CERTIFICATE_CONFIG,
  SAMPLE_CERTIFICATE_DATA,
} from "@/lib/certificates/templates";
