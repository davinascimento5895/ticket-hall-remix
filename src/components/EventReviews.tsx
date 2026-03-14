import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventReviewsProps {
  eventId: string;
  isPastEvent: boolean;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn("transition-colors", readonly ? "cursor-default" : "cursor-pointer")}
        >
          <Star
            className={cn(
              "h-5 w-5",
              (hover || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function EventReviews({ eventId, isPastEvent }: EventReviewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["event-reviews", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_reviews")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const userReview = reviews.find((r: any) => r.user_id === user?.id);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login necessário");
      const { error } = await supabase
        .from("event_reviews")
        .upsert({
          user_id: user.id,
          event_id: eventId,
          rating,
          comment: comment.trim() || null,
        }, { onConflict: "user_id,event_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reviews", eventId] });
      toast({ title: "Avaliação enviada!" });
      setShowForm(false);
      setRating(0);
      setComment("");
    },
    onError: () => toast({ title: "Erro ao enviar avaliação", variant: "destructive" }),
  });

  const canReview = isPastEvent && user && !userReview;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">
          Avaliações
          {reviews.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({reviews.length}) · {avgRating.toFixed(1)} ★
            </span>
          )}
        </h3>
        {canReview && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Avaliar
          </Button>
        )}
      </div>

      {showForm && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe um comentário (opcional)"
            className="resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => submitReview.mutate()} disabled={rating === 0 || submitReview.isPending}>
              {submitReview.isPending ? "Enviando..." : "Enviar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setRating(0); setComment(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => {
            const profile = review.profiles;
            const initials = profile?.full_name
              ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            return (
              <div key={review.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{profile?.full_name || "Anônimo"}</span>
                    <StarRating value={review.rating} readonly />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    {format(new Date(review.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
