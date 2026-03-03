import { cn } from "@/lib/utils";

interface TicketHallLogoProps {
  variant?: "full" | "compact" | "symbol";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
};

export function TicketHallLogo({ variant = "full", size = "md", className }: TicketHallLogoProps) {
  const s = sizes[size];

  const icon = (
    <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="36" height="28" rx="6" fill="url(#logo-grad)" />
      {/* Ticket notches */}
      <circle cx="2" cy="20" r="4" fill="hsl(240,10%,3.5%)" />
      <circle cx="38" cy="20" r="4" fill="hsl(240,10%,3.5%)" />
      {/* Dashed line */}
      <line x1="14" y1="10" x2="14" y2="30" stroke="hsl(240,10%,3.5%)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      {/* TH text */}
      <text x="26" y="25" textAnchor="middle" fill="white" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="12">TH</text>
    </svg>
  );

  if (variant === "symbol") return <span className={className}>{icon}</span>;

  if (variant === "compact") return <span className={className}>{icon}</span>;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon}
      <span className={cn("font-display font-bold tracking-tight", s.text)}>
        Ticket<span className="text-accent">Hall</span>
      </span>
    </span>
  );
}
