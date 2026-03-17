import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducers } from "@/lib/api-admin";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";

export default function AdminProducers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: producers, isLoading } = useQuery({
    queryKey: ["admin-producers", debouncedSearch],
    queryFn: () => getProducers(debouncedSearch || undefined),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Produtores</h1>

      <div className="max-w-md">
        <SearchInput placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !producers || producers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produtor encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {producers.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/admin/producers/${p.id}`)}
                  className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{p.full_name || "Sem nome"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {p.phone && <span>{p.phone}</span>}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span>{p.events_count ?? 0} evento(s)</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
