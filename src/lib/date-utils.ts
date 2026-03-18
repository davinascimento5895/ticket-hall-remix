/**
 * Centralized date formatting utilities with America/Sao_Paulo timezone
 */

const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";

/**
 * Format date only (e.g., "17/03/2026")
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
}

/**
 * Format date with short month (e.g., "17 Mar 2026")
 */
export function formatDateShortBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Format date with long month (e.g., "17 de março de 2026")
 */
export function formatDateLongBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Format date with weekday (e.g., "seg, 17 de março de 2026")
 */
export function formatDateWithWeekdayBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTimeBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

/**
 * Format time with seconds (e.g., "14:30:45")
 */
export function formatTimeWithSecondsBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: TIMEZONE,
  });
}

/**
 * Format date and time combined (e.g., "17/03/2026, 14:30")
 */
export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(LOCALE, { timeZone: TIMEZONE });
}

/**
 * Get custom format options with timezone already set
 * Usage: date.toLocaleDateString(LOCALE, getDateOptionsWithTZ({...}))
 */
export function getDateOptionsWithTZ(
  options: Intl.DateTimeFormatOptions = {}
): Intl.DateTimeFormatOptions {
  return { ...options, timeZone: TIMEZONE };
}
