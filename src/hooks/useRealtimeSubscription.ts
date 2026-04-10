import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "tickets" | "orders" | "event_analytics" | "checkin_sessions" | "producer_messages";

interface UseRealtimeOptions {
  table: TableName;
  filter?: string;
  queryKey: string[];
  enabled?: boolean;
}

/**
 * Subscribe to Postgres changes on a table and auto-invalidate react-query cache.
 */
export function useRealtimeSubscription({ table, filter, queryKey, enabled = true }: UseRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${filter || "all"}`;
    const channelConfig: any = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", channelConfig, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Realtime channel error:", channelName);
        }
      });

    return () => {
      channel.unsubscribe().catch(() => {});
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [table, filter, queryKey.join(","), enabled, queryClient]);
}
