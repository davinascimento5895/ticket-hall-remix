import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** true para o primeiro card visível da página (LCP) — desativa lazy e prioriza fetch */
  priority?: boolean;
}

export function EventImage({ src, alt, className, priority = false }: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  let imgSrc: string | null = src && !hasError ? src : null;

  // Substitui imagens com marcas irrelevantes (ex.: 'netflix') por uma imagem neutra
  // obtida via Unsplash. Isso evita exibir logos/personalizações indesejadas.
  if (imgSrc) {
    try {
      const low = imgSrc.toLowerCase();
      if (low.includes("netflix")) {
        imgSrc = "https://source.unsplash.com/1200x750/?event,concert";
      }
    } catch {
      // ignore
    }
  }

  if (!imgSrc) {
    return (
      <div className={cn("bg-secondary flex items-center justify-center", className)}>
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      onError={() => setHasError(true)}
    />
  );
}
