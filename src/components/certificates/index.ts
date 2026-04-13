/**
 * Certificate Configuration Components
 *
 * Comprehensive UI components for configuring certificates in the producer panel.
 */

// Field Configuration
export { FieldConfigurator } from "./FieldConfigurator";
export type { FieldConfiguratorProps } from "./FieldConfigurator";

// Text Configuration
export { TextConfigurator } from "./TextConfigurator";
export type { TextConfiguratorProps } from "./TextConfigurator";

// Text Position Controls
export { TextPositionControls } from "./TextPositionControls";

// Signers Management
export { SignersManager } from "./SignersManager";
export type { Signer, SignersManagerProps } from "./SignersManager";

// Background Upload
export { BackgroundUploader } from "./BackgroundUploader";
export type { BackgroundUploaderProps } from "./BackgroundUploader";

// Image Crop for certificate background
export { CertificateImageCrop } from "./CertificateImageCrop";

// LinkedIn Integration
export { LinkedInIntegration } from "./LinkedInIntegration";
export type { LinkedInIntegrationProps } from "./LinkedInIntegration";

// Certificate Preview
export {
  CertificatePreview,
  type CertificatePreviewProps,
  type CertificateFields,
  type CertificateTextConfig,
  type CertificateSigner,
  type CertificateSampleData,
  type CertificateTextPositions,
  type CertificateFontSizes,
} from "./CertificatePreview";
