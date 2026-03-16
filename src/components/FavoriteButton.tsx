import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ eventId, className, size = "sm" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(eventId);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      // Open global auth modal via navbar's login query param (keeps existing logic)
      navigate("/?login=true", { state: { from: location } });
      return;
    }
    toggleFavorite(eventId);
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all active:scale-90",
        size === "sm" ? "w-8 h-8" : "w-10 h-10",
        active
          ? "bg-destructive/10 text-destructive"
          : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive",
        className
      )}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={cn(iconSize, active && "fill-current")} />
    </button>
  );
}
