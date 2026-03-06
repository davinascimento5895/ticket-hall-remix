import { cn } from "@/lib/utils";
import logoFullBlack from "@/assets/logo-full-black.png";
import logoFullWhite from "@/assets/logo-full-white.png";
import logoIconBlack from "@/assets/logo-icon-black.png";
import logoIconWhite from "@/assets/logo-icon-white.png";

interface TicketHallLogoProps {
  variant?: "full" | "compact" | "symbol";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Force a specific color variant instead of auto-detecting theme */
  forceDark?: boolean;
}

const sizes = {
  sm: { full: "h-8", icon: "h-7" },
  md: { full: "h-9", icon: "h-8" },
  lg: { full: "h-12", icon: "h-10" },
};

export function TicketHallLogo({ variant = "full", size = "md", className, forceDark }: TicketHallLogoProps) {
  const s = sizes[size];

  // In dark mode we show white logo, in light mode we show black logo
  // Uses CSS to toggle visibility based on .dark class on html
  if (variant === "symbol" || variant === "compact") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <img src={forceDark ? logoIconWhite : logoIconWhite} alt="TicketHall" className={cn(s.icon, "w-auto dark:block", forceDark ? "block" : "hidden")} />
        <img src={logoIconBlack} alt="TicketHall" className={cn(s.icon, "w-auto dark:hidden", forceDark ? "hidden" : "block")} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src={forceDark ? logoFullWhite : logoFullWhite} alt="TicketHall — Do clique ao palco" className={cn(s.full, "w-auto dark:block", forceDark ? "block" : "hidden")} />
      <img src={logoFullBlack} alt="TicketHall — Do clique ao palco" className={cn(s.full, "w-auto dark:hidden", forceDark ? "hidden" : "block")} />
    </span>
  );
}
