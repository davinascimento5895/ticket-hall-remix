import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToCSV, userCSVColumns } from "@/lib/csv-export";
import { Input } from "@/components/ui/input";
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
import { getAllUsers } from "@/lib/api-admin";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF } from "@/lib/validators";
import { useState } from "react";
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
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => getAllUsers(debouncedSearch || undefined),
    staleTime: 30_000,
  });

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

  // Pagination
  const allUsers = users || [];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / perPage));
  const paginatedUsers = allUsers.slice((page - 1) * perPage, page * perPage);
  // Reset page when search changes
  const [lastSearch, setLastSearch] = useState(debouncedSearch);
  if (debouncedSearch !== lastSearch) { setLastSearch(debouncedSearch); setPage(1); }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => users && exportToCSV(users, csvColumnsWithRole, "usuarios")} disabled={!users?.length}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !users || users.length === 0 ? (
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
                  {paginatedUsers.map((user: any) => {
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
      {allUsers.length > perPage && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{allUsers.length} usuário(s) · Página {page} de {totalPages}</span>
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
