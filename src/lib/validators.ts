export {
  detectDocumentType,
  sanitizeDocument,
  validateCPF,
  validateCNPJ,
  validateDocument,
  formatDocument,
  formatCPF,
  formatCNPJ,
} from "@/utils/document";

/**
 * Masks a CPF for display, showing only the last 2 digits.
 * Example: "123.456.789-00" → "***.***.*89-00"
 */
export const maskCPF = (cpf: string): string => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length < 11) return cpf;
  return `***.***.*${clean.slice(7, 9)}-${clean.slice(9)}`;
};

/**
 * Formats a phone number as (00) 00000-0000
 */
export const formatPhone = (value: string): string => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 2) return clean;
  if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
};
