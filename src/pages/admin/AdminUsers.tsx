import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Shield, ShieldOff, Loader2 } from "lucide-react";
import { exportToCSV, userCSVColumns } from "@/lib/csv-export";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllUsers } from "@/lib/api-admin";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF } from "@/lib/validators";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/hooks/use-toast";

async function changeUserRole(userId: string, newRole: string) {
  // Delete existing roles, then insert new one
  await supabase.from("user_roles").delete().eq("user_id", userId);
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any);
  if (error) throw error;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => getAllUsers(debouncedSearch || undefined),
    staleTime: 30_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => changeUserRole(userId, role),
    onSuccess: () => {
      toast({ title: "Papel atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar papel", description: err.message, variant: "destructive" });
    },
  });

  const roleLabel: Record<string, string> = { admin: "Admin", producer: "Produtor", buyer: "Comprador" };
  const availableRoles = ["buyer", "producer", "admin"];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => users && exportToCSV(users, userCSVColumns, "usuarios")} disabled={!users?.length}>
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
                    <th className="p-3 font-medium">Papel</th>
                    <th className="p-3 font-medium">Cadastro</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => {
                    const role = user.role || "buyer";
                    return (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">{user.full_name || "—"}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{user.cpf ? maskCPF(user.cpf) : "—"}</td>
                        <td className="p-3 text-muted-foreground">{user.phone || "—"}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${role === "admin" ? "bg-destructive/15 text-destructive border-destructive/20" : role === "producer" ? "bg-primary/15 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>
                            {roleLabel[role] || role}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={roleMutation.isPending}>
                                {roleMutation.isPending && roleMutation.variables?.userId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Shield className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {availableRoles
                                .filter((r) => r !== role)
                                .map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => roleMutation.mutate({ userId: user.id, role: r })}
                                  >
                                    Alterar para {roleLabel[r]}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}
