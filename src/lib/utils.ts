import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Brazilian Real currency: R$ 1.234,56 */
export function formatBRL(value: number | null | undefined): string {
  return `R$ ${(value ?? 0)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** Format as BRL, but returns "Grátis" for zero values */
export function formatBRLOrFree(value: number): string {
  return value === 0 ? "Grátis" : formatBRL(value);
}
