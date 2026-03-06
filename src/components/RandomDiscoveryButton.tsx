import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RandomDiscoveryButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);

  const { data: events } = useQuery({
    queryKey: ["events-for-discovery"],
    queryFn: () => getEvents({ limit: 50 }),
    staleTime: 1000 * 60 * 5,
  });

  const handleDiscover = () => {
    if (!events || events.length === 0) return;
    setSpinning(true);
    setTimeout(() => {
      const random = events[Math.floor(Math.random() * events.length)];
      setSpinning(false);
      navigate(`/eventos/${random.slug}`);
    }, 600);
  };

  return (
    <Button
      variant="outline"
      onClick={handleDiscover}
      disabled={!events?.length || spinning}
      className={cn("gap-2 border-primary/30 text-primary hover:bg-primary/10", className)}
    >
      <Shuffle className={cn("h-4 w-4 transition-transform", spinning && "animate-spin")} />
      Surpreenda-me
    </Button>
  );
}
