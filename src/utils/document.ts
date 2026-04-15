/**
 * Document sanitization, detection, validation, and formatting utilities.
 * Supports Brazilian CPF and CNPJ.
 */

/**
 * Strips all non-numeric characters from a document string.
 */
export function sanitizeDocument(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Detects document type based on digit count.
 */
export function detectDocumentType(digits: string): "cpf" | "cnpj" | null {
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return null;
}

/**
 * Validates a CPF using the official Brazilian check digit algorithm.
 */
export function validateCPF(digits: string): boolean {
  const clean = sanitizeDocument(digits);
  if (clean.length !== 11) return false;

  // Reject known invalid sequences
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  if (firstDigit !== parseInt(clean[9], 10)) return false;

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  if (secondDigit !== parseInt(clean[10], 10)) return false;

  return true;
}

/**
 * Validates a CNPJ using the official Brazilian check digit algorithm.
 */
export function validateCNPJ(digits: string): boolean {
  const clean = sanitizeDocument(digits);
  if (clean.length !== 14) return false;

  // Reject known invalid sequences
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * weights1[i];
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  if (firstDigit !== parseInt(clean[12], 10)) return false;

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i], 10) * weights2[i];
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  if (secondDigit !== parseInt(clean[13], 10)) return false;

  return true;
}

/**
 * Validates a document (CPF or CNPJ) and returns the result with type and optional error message.
 */
export function validateDocument(digits: string): {
  valid: boolean;
  type: "cpf" | "cnpj" | null;
  error?: string;
} {
  const clean = sanitizeDocument(digits);

  if (!clean) {
    return { valid: false, type: null, error: "Documento é obrigatório" };
  }

  const type = detectDocumentType(clean);

  if (!type) {
    return { valid: false, type: null, error: "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)" };
  }

  if (type === "cpf") {
    if (!validateCPF(clean)) {
      return { valid: false, type: "cpf", error: "CPF inválido" };
    }
    return { valid: true, type: "cpf" };
  }

  if (type === "cnpj") {
    if (!validateCNPJ(clean)) {
      return { valid: false, type: "cnpj", error: "CNPJ inválido" };
    }
    return { valid: true, type: "cnpj" };
  }

  return { valid: false, type: null, error: "Documento inválido" };
}

/**
 * Formats a CPF for display: 12345678909 -> 123.456.789-09
 */
export function formatCPF(digits: string): string {
  const clean = sanitizeDocument(digits).slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

/**
 * Formats a CNPJ for display: 12345678000195 -> 12.345.678/0001-95
 */
export function formatCNPJ(digits: string): string {
  const clean = sanitizeDocument(digits).slice(0, 14);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
}

/**
 * Formats a document (CPF or CNPJ) based on its type.
 */
export function formatDocument(digits: string, type: "cpf" | "cnpj"): string {
  if (type === "cpf") return formatCPF(digits);
  if (type === "cnpj") return formatCNPJ(digits);
  return digits;
}
