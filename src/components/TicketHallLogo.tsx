import { cn } from "@/lib/utils";
import logoFullBlackSvg from "@/assets/logo-full-black.svg";
import logoFullWhiteSvg from "@/assets/logo-full-white.svg";

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
  const h = variant === "symbol" || variant === "compact" ? s.icon : s.full;

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img src={forceDark ? logoFullWhiteSvg : logoFullWhiteSvg} alt="TicketHall" className={cn(h, "w-auto dark:block", forceDark ? "block" : "hidden")} />
      <img src={logoFullBlackSvg} alt="TicketHall" className={cn(h, "w-auto dark:hidden", forceDark ? "hidden" : "block")} />
    </span>
  );
}
