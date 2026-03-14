import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface EventImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function EventImage({ src, alt, className }: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  const imgSrc = src && !hasError ? src : null;

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
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
