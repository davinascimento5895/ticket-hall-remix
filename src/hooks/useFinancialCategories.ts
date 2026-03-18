import { useEffect, useMemo, useState } from "react";
import { getFinancialCategories, createFinancialCategory, deleteFinancialCategory } from "@/lib/api-financial-categories";

export type FinancialCategoryType = "payable" | "receivable";

export interface FinancialCategoryOption {
  id?: string;
  value: string;
  label: string;
}

const DEFAULT_CATEGORIES: Record<FinancialCategoryType, FinancialCategoryOption[]> = {
  payable: [
    { value: "commission", label: "Comissao" },
    { value: "refund", label: "Reembolso" },
    { value: "platform_fee", label: "Taxa da plataforma" },
    { value: "other", label: "Outro" },
  ],
  receivable: [
    { value: "ticket_sale", label: "Venda de ingressos" },
    { value: "payout", label: "Repasse" },
    { value: "other", label: "Outro" },
  ],
};

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  commission: "Comissao",
  refund: "Reembolso",
  platform_fee: "Taxa da plataforma",
  other: "Outro",
  ticket_sale: "Venda de ingressos",
  payout: "Repasse",
};

function getStorageKey(producerId: string, type: FinancialCategoryType) {
  return `financial_categories_${producerId}_${type}`;
}

function createCategoryValue(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function parseStoredCategories(raw: string | null): FinancialCategoryOption[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const sanitized = parsed
      .map((item) => ({
        value: String(item?.value || "").trim(),
        label: String(item?.label || "").trim(),
      }))
      .filter((item) => item.value && item.label);

    return sanitized.length > 0 ? sanitized : null;
  } catch {
    return null;
  }
}

function humanizeCategory(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function resolveFinancialCategoryLabel(value: string, categories: FinancialCategoryOption[]) {
  const dynamic = categories.find((category) => category.value === value);
  if (dynamic) return dynamic.label;
  if (LEGACY_CATEGORY_LABELS[value]) return LEGACY_CATEGORY_LABELS[value];
  return humanizeCategory(value);
}

export function useFinancialCategories(producerId: string, type: FinancialCategoryType) {
  const [categories, setCategories] = useState<FinancialCategoryOption[]>(DEFAULT_CATEGORIES[type]);

  // Try to load from server; if fails, fall back to localStorage
  useEffect(() => {
    let mounted = true;

    async function load() {
      // Attempt server fetch
      try {
        if (producerId) {
          const server = await getFinancialCategories(producerId, type);
          if (!mounted) return;
          if (server && server.length > 0) {
            setCategories(server.map((s: any) => ({ id: s.id, value: s.value, label: s.label })));
            return;
          }

          // No server categories: try migrating from localStorage if present
          const storageKey = getStorageKey(producerId, type);
          const stored = parseStoredCategories(localStorage.getItem(storageKey));
          if (stored && stored.length > 0) {
            // create them on server
            try {
              await Promise.all(stored.map((c) => createFinancialCategory(producerId, type, { value: c.value, label: c.label })));
              const refreshed = await getFinancialCategories(producerId, type);
              if (!mounted) return;
              setCategories(refreshed.map((s: any) => ({ id: s.id, value: s.value, label: s.label })));
              return;
            } catch (err) {
              // fallback to local
            }
          }
        }
      } catch (err) {
        // server error -> fallback
      }

      // Fallback: use localStorage or defaults
      const storageKey = getStorageKey(producerId, type);
      const stored = parseStoredCategories(localStorage.getItem(storageKey));
      setCategories(stored || DEFAULT_CATEGORIES[type]);
    }

    load();

    return () => { mounted = false; };
  }, [producerId, type]);

  const persistLocal = (next: FinancialCategoryOption[]) => {
    setCategories(next);
    localStorage.setItem(getStorageKey(producerId, type), JSON.stringify(next.map(({ id, ...rest }) => rest)));
  };

  const addCategory = async (label: string) => {
    const trimmedLabel = label.trim();
    const value = createCategoryValue(trimmedLabel);

    if (!trimmedLabel || !value) {
      return { ok: false as const, reason: "Nome invalido" };
    }

    const alreadyExists = categories.some(
      (category) => category.value === value || category.label.toLowerCase() === trimmedLabel.toLowerCase(),
    );

    if (alreadyExists) {
      return { ok: false as const, reason: "Categoria ja existe" };
    }

    // Try server first
    if (producerId) {
      try {
        await createFinancialCategory(producerId, type, { value, label: trimmedLabel });
        // refresh from server to get canonical ids/ordering
        const refreshed = await getFinancialCategories(producerId, type);
        const next = refreshed.map((s: any) => ({ id: s.id, value: s.value, label: s.label }));
        setCategories(next);
        localStorage.setItem(getStorageKey(producerId, type), JSON.stringify(next.map(({ id, ...rest }) => rest)));
        return { ok: true as const, value };
      } catch (err: any) {
        // fallback to local
      }
    }

    // Local fallback
    persistLocal([...categories, { value, label: trimmedLabel }]);
    return { ok: true as const, value };
  };

  const removeCategory = async (value: string) => {
    if (categories.length <= 1) {
      return { ok: false as const, reason: "Mantenha pelo menos uma categoria" };
    }

    const found = categories.find((c) => c.value === value);
    if (!found) return { ok: false as const, reason: "Categoria nao encontrada" };

    // Try server delete if possible
    if (producerId && found.id) {
      try {
        await deleteFinancialCategory(found.id);
        const next = categories.filter((c) => c.value !== value);
        setCategories(next);
        localStorage.setItem(getStorageKey(producerId, type), JSON.stringify(next.map(({ id, ...rest }) => rest)));
        return { ok: true as const, fallback: next[0]?.value || "other" };
      } catch (err) {
        // fallback to local
      }
    }

    const next = categories.filter((category) => category.value !== value);
    if (next.length === categories.length) {
      return { ok: false as const, reason: "Categoria nao encontrada" };
    }

    persistLocal(next);
    return { ok: true as const, fallback: next[0]?.value || "other" };
  };

  const options = useMemo(() => categories, [categories]);

  return {
    categories: options,
    addCategory,
    removeCategory,
  };
}
