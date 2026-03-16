import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((f: any) => f.event_id as string);
    },
    enabled: !!user?.id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Login necessário");
      const isFav = favoriteIds.includes(eventId);
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);
        if (error) throw error;
        return { added: false };
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, event_id: eventId });
        if (error) throw error;
        return { added: true };
      }
    },
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previous = queryClient.getQueryData<string[]>(["favorites", user?.id]) ?? [];
      const isFav = previous.includes(eventId);
      const next = isFav ? previous.filter((id) => id !== eventId) : [...previous, eventId];
      queryClient.setQueryData(["favorites", user?.id], next);
      return { previous };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["favorites", user?.id], context.previous);
      }
      toast({ title: "Erro ao atualizar favoritos", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      // Invalidate then force refetch of favorite-events for this user (including inactive queries)
      queryClient.invalidateQueries({ queryKey: ["favorite-events", user?.id] });
      queryClient.refetchQueries({ queryKey: ["favorite-events", user?.id], exact: true, refetchType: "all" });
    },
  });

  const isFavorite = (eventId: string) => favoriteIds.includes(eventId);

  return { favoriteIds, isFavorite, toggleFavorite: toggleFavorite.mutate, isLoading };
}
