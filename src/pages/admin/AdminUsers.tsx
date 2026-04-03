import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, ChevronLeft, ChevronRight, Users, Shield, UserRound } from "lucide-react";
import { exportToCSV, userCSVColumns } from "@/lib/csv-export";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAllUsersPaginated } from "@/lib/api-admin";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF } from "@/lib/validators";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/EmptyState";

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
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
  if (error) {
    if (error.code === "23505") return;
    throw error;
  }
}

async function removeRole(userId: string, role: string) {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
  if (error) throw error;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

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

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, resetPage]);

  const userIds = useMemo(() => users.map((u: any) => u.id), [users]);
  const { data: rolesData } = useQuery({
    queryKey: ["admin-user-roles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
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
      toast({ title: "Papel atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar papel", description: err.message, variant: "destructive" });
    },
  });

  const csvColumnsWithRole = [
    ...userCSVColumns,
    {
      key: "roles",
      header: "Papéis",
      format: (v: string[]) => (v || []).map((r: string) => roleLabel[r] || r).join(", "),
    },
  ];

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, producer: 0, staff: 0, buyer: 0 };
    usersWithRoles.forEach((user: any) => {
      const uniqueRoles = new Set(user.roles?.length ? user.roles : ["buyer"]);
      uniqueRoles.forEach((role) => {
        if (counts[role as keyof typeof counts] !== undefined) {
          counts[role as keyof typeof counts] += 1;
        }
      });
    });
    return counts;
  }, [usersWithRoles]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Base de usuários"
        title="Usuários"
        description="Perfis sincronizados com roles da plataforma. A busca cobre nome, CPF e telefone; os papéis podem ser alterados sem sair da tela."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => usersWithRoles.length && exportToCSV(usersWithRoles, csvColumnsWithRole, "usuarios")}
            disabled={!usersWithRoles.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Encontrados</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-3xl font-bold">{totalCount}</span>
              <span className="text-xs text-muted-foreground">{totalCount === 1 ? "perfil" : "perfis"}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nesta página</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-3xl font-bold">{usersWithRoles.length}</span>
              <span className="text-xs text-muted-foreground">registros</span>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status do acesso</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="border-destructive/20 bg-destructive/10 text-destructive">{roleCounts.admin} admins</Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary">{roleCounts.producer} produtores</Badge>
              <Badge className="border-accent/20 bg-accent/10 text-accent">{roleCounts.staff} equipe</Badge>
            </div>
          </div>
        </div>
      </AdminPageHeader>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl flex-1">
              <SearchInput
                placeholder="Buscar por nome, CPF ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {totalCount} usuário(s) no total
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : usersWithRoles.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum usuário encontrado"
              description={debouncedSearch ? "A busca não encontrou perfis correspondentes." : "Ainda não existem perfis cadastrados."}
              actionLabel={debouncedSearch ? "Limpar busca" : undefined}
              onAction={debouncedSearch ? () => setSearch("") : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-left text-muted-foreground">
                    <th className="p-4 font-medium">Usuário</th>
                    <th className="p-4 font-medium">Contato</th>
                    <th className="p-4 font-medium">Papéis</th>
                    <th className="p-4 font-medium">Cadastro</th>
                    <th className="p-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithRoles.map((user: any) => {
                    const roles: string[] = user.roles || ["buyer"];
                    return (
                      <tr key={user.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border border-border/70">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "Usuário"} />
                              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                <UserRound className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                              <p className="font-mono text-xs text-muted-foreground">ID {user.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">{user.phone || "—"}</p>
                            <p className="font-mono text-xs text-muted-foreground">{user.cpf ? maskCPF(user.cpf) : "—"}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {roles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleStyle[r] || roleStyle.buyer}`}
                              >
                                {roleLabel[r] || r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="p-4 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Shield className="h-4 w-4" />
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
                                    <div key={r} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
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
                                      <Label htmlFor={`role-${user.id}-${r}`} className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-between gap-3">
                                          <div>
                                            <p className="font-medium">{roleLabel[r]}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {r === "admin"
                                                ? "Acesso total ao painel"
                                                : r === "producer"
                                                  ? "Gestão de eventos e vendas"
                                                  : r === "staff"
                                                    ? "Operação de check-in e suporte"
                                                    : "Perfil padrão do comprador"}
                                            </p>
                                          </div>
                                          <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleStyle[r] || roleStyle.buyer}`}
                                          >
                                            {roleLabel[r]}
                                          </span>
                                        </div>
                                        {isOnlyRole && (
                                          <span className="mt-1 block text-xs text-muted-foreground">único papel ativo</span>
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

      {totalCount > pageSize && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {totalCount} usuário(s) · Página {page} de {totalPages}
          </span>
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