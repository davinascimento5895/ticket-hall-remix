import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllUsers } from "@/lib/api-admin";
import { useState } from "react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => getAllUsers(search || undefined),
  });

  const roleLabel: Record<string, string> = { admin: "Admin", producer: "Produtor", buyer: "Comprador" };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => {
                    const role = user.user_roles?.[0]?.role || "buyer";
                    return (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">{user.full_name || "—"}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{user.cpf || "—"}</td>
                        <td className="p-3 text-muted-foreground">{user.phone || "—"}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${role === "admin" ? "bg-destructive/15 text-destructive border-destructive/20" : role === "producer" ? "bg-primary/15 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>
                            {roleLabel[role] || role}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td>
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
