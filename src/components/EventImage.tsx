import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** true para o primeiro card visível da página (LCP) — desativa lazy e prioriza fetch */
  priority?: boolean;
}

/**
 * Hash simples para gerar seed determinístico baseado na URL
 * Evita sempre a mesma imagem Unsplash e bypass de rate limiting
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export function EventImage({ src, alt, className, priority = false }: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  let imgSrc: string | null = src && !hasError ? src : null;

  // Substitui imagens com marcas irrelevantes (ex.: 'netflix') por uma imagem neutra
  // obtida via Unsplash com seed hash para evitar rate limiting.
  // Isso evita exibir logos/personalizações indesejadas.
  const finalSrc = useMemo(() => {
    if (!imgSrc) return null;
    
    try {
      const low = imgSrc.toLowerCase();
      if (low.includes("netflix")) {
        const seed = hashUrl(imgSrc);
        return `https://source.unsplash.com/1200x750/?event,concert&sig=${seed}`;
      }
    } catch {
      // ignore
    }

    return imgSrc;
  }, [imgSrc]);

  if (!finalSrc) {
    return (
      <div className={cn("bg-secondary flex items-center justify-center", className)}>
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn("w-full h-full object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      onError={() => setHasError(true)}
    />
  );
}
