import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ expiresAt, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresAt.getTime() - Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire, timeLeft]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = minutes < 3;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${isUrgent ? "text-destructive" : "text-warning"} ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
