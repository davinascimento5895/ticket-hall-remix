import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      toast.success(result.added ? "Adicionado aos favoritos" : "Removido dos favoritos");
    },
    onError: () => {
      toast.error("Erro ao atualizar favoritos");
    },
  });

  const isFavorite = (eventId: string) => favoriteIds.includes(eventId);

  return { favoriteIds, isFavorite, toggleFavorite: toggleFavorite.mutate, isLoading };
}
