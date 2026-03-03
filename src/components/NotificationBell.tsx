import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { getNotifications, markNotificationsRead } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: () => markNotificationsRead(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markRead.mutate();
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <h4 className="font-display font-semibold text-sm text-foreground">Notificações</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={cn(
                  "p-3 border-b border-border last:border-0 transition-colors",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
