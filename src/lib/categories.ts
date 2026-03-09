import {
  Music,
  Theater,
  Mic2,
  Dumbbell,
  MapPin,
  Tag,
  Presentation,
  Baby,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * Central source of truth for event categories.
 * Used across landing page, producer form, and event filters.
 */
export const EVENT_CATEGORIES: Category[] = [
  { 
    value: "shows", 
    label: "Festas e Shows", 
    icon: Music,
    description: "Shows, festas, baladas e eventos musicais"
  },
  { 
    value: "theater", 
    label: "Teatros e Espetáculos", 
    icon: Theater,
    description: "Peças teatrais, musicais e espetáculos"
  },
  { 
    value: "standup", 
    label: "Stand Up Comedy", 
    icon: Mic2,
    description: "Shows de comédia e humor"
  },
  { 
    value: "sports", 
    label: "Esportes", 
    icon: Dumbbell,
    description: "Jogos, competições e eventos esportivos"
  },
  { 
    value: "tours", 
    label: "Passeios e Tours", 
    icon: MapPin,
    description: "Passeios turísticos e experiências"
  },
  { 
    value: "deals", 
    label: "Descontos Exclusivos", 
    icon: Tag,
    description: "Eventos com ofertas e promoções especiais"
  },
  { 
    value: "corporate", 
    label: "Congressos e Palestras", 
    icon: Presentation,
    description: "Eventos corporativos, palestras e workshops"
  },
  { 
    value: "kids", 
    label: "Infantil", 
    icon: Baby,
    description: "Eventos para crianças e famílias"
  },
  { 
    value: "shopping", 
    label: "Eventos com Loja", 
    icon: ShoppingBag,
    description: "Feiras, bazares e eventos com vendas"
  },
  { 
    value: "other", 
    label: "Outros", 
    icon: Sparkles,
    description: "Outros tipos de eventos"
  },
];

/**
 * Get category by value
 */
export function getCategoryByValue(value: string): Category | undefined {
  return EVENT_CATEGORIES.find((c) => c.value === value);
}

/**
 * Get category label by value
 */
export function getCategoryLabel(value: string): string {
  return getCategoryByValue(value)?.label || value;
}

/**
 * Categories for select inputs (includes "All" option)
 */
export const CATEGORY_OPTIONS = [
  { value: "", label: "Todas as categorias" },
  ...EVENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];
