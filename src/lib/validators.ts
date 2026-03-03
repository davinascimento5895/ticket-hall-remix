/**
 * Validates a Brazilian CPF number (checks digit verification, not just format).
 */
export const validateCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;

  const calcDigit = (slice: string, len: number) => {
    const sum = slice.split('').reduce((acc, d, i) => acc + Number(d) * (len + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem >= 10 ? 0 : rem;
  };

  return (
    calcDigit(clean.slice(0, 9), 9) === Number(clean[9]) &&
    calcDigit(clean.slice(0, 10), 10) === Number(clean[10])
  );
};

/**
 * Formats a CPF string as 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
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
