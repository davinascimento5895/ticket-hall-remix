import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToCSV, userCSVColumns } from "@/lib/csv-export";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getAllUsersPaginated } from "@/lib/api-admin";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF } from "@/lib/validators";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/hooks/use-toast";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  producer: "Produtor",
  buyer: "Comprador",
  staff: "Equipe",
};

const roleStyle: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/20",
  producer: "bg-primary/15 text-primary border-primary/20",
  staff: "bg-accent/15 text-accent border-accent/20",
  buyer: "bg-secondary text-muted-foreground border-border",
};

const allRoles = ["buyer", "producer", "staff", "admin"];

async function addRole(userId: string, role: string) {
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role } as any);
  if (error) {
    // Ignore duplicate — role already exists
    if (error.code === "23505") return;
    throw error;
  }
}

async function removeRole(userId: string, role: string) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role as any);
  if (error) throw error;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);

  const {
    items: users,
    totalCount,
    page,
    totalPages,
    pageSize,
    setPage,
    resetPage,
    isLoading,
  } = usePaginatedQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: (range) => getAllUsersPaginated({ search: debouncedSearch || undefined }, range),
    pageSize: 20,
    staleTime: 30_000,
  });

  // Reset page when search changes
  useEffect(() => {
    resetPage();
  }, [debouncedSearch, resetPage]);

  // Fetch all user_roles separately (small table) and build a role map
  const userIds = useMemo(() => users.map((u: any) => u.id), [users]);
  const { data: rolesData } = useQuery({
    queryKey: ["admin-user-roles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
    staleTime: 30_000,
  });

  const roleMap = useMemo(() => {
    const map = new Map<string, string[]>();
    (rolesData || []).forEach((r: any) => {
      const existing = map.get(r.user_id) || [];
      existing.push(r.role);
      map.set(r.user_id, existing);
    });
    return map;
  }, [rolesData]);

  // Merge roles into users for display
  const usersWithRoles = useMemo(
    () => users.map((u: any) => ({ ...u, roles: roleMap.get(u.id) || ["buyer"] })),
    [users, roleMap]
  );

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, role, enabled }: { userId: string; role: string; enabled: boolean }) => {
      if (enabled) {
        await addRole(userId, role);
      } else {
        await removeRole(userId, role);
      }
    },
    onSuccess: () => {
      toast({ title: "Papel atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar papel", description: err.message, variant: "destructive" });
    },
  });

  // CSV with roles column
  const csvColumnsWithRole = [
    ...userCSVColumns,
    {
      key: "roles",
      header: "Papéis",
      format: (v: string[]) => (v || []).map((r: string) => roleLabel[r] || r).join(", "),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
        </div>
        <Button variant="outline" size="sm" onClick={() => usersWithRoles.length && exportToCSV(usersWithRoles, csvColumnsWithRole, "usuarios")} disabled={!usersWithRoles.length}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : usersWithRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum usuário encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">CPF</th>
                    <th className="p-3 font-medium">Telefone</th>
                    <th className="p-3 font-medium">Papéis</th>
                    <th className="p-3 font-medium">Cadastro</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithRoles.map((user: any) => {
                    const roles: string[] = user.roles || ["buyer"];
                    return (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">{user.full_name || "—"}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{user.cpf ? maskCPF(user.cpf) : "—"}</td>
                        <td className="p-3 text-muted-foreground">{user.phone || "—"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${roleStyle[r] || roleStyle.buyer}`}
                              >
                                {roleLabel[r] || r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                                Gerenciar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Papéis de {user.full_name || "Usuário"}</DialogTitle>
                                <DialogDescription>
                                  Marque ou desmarque os papéis deste usuário. As alterações são aplicadas imediatamente.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-2">
                                {allRoles.map((r) => {
                                  const hasRole = roles.includes(r);
                                  const isOnlyRole = roles.length === 1 && hasRole;
                                  return (
                                    <div key={r} className="flex items-center space-x-3">
                                      <Checkbox
                                        id={`role-${user.id}-${r}`}
                                        checked={hasRole}
                                        disabled={toggleRoleMutation.isPending || isOnlyRole}
                                        onCheckedChange={(checked) => {
                                          toggleRoleMutation.mutate({
                                            userId: user.id,
                                            role: r,
                                            enabled: !!checked,
                                          });
                                        }}
                                      />
                                      <Label htmlFor={`role-${user.id}-${r}`} className="flex items-center gap-2 cursor-pointer">
                                        <span
                                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${roleStyle[r] || roleStyle.buyer}`}
                                        >
                                          {roleLabel[r]}
                                        </span>
                                        {isOnlyRole && (
                                          <span className="text-xs text-muted-foreground">(único papel)</span>
                                        )}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                              {toggleRoleMutation.isPending && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Atualizando...
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} usuário(s) · Página {page} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
