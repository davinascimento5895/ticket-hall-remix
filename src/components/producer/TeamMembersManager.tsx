import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserPlus, Shield, Eye, Scan, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Acesso total", icon: Shield },
  { value: "manager", label: "Gerente", desc: "Tudo exceto financeiro", icon: Eye },
  { value: "checkin_staff", label: "Check-in", desc: "Apenas scanner", icon: Scan },
  { value: "reports_only", label: "Relatórios", desc: "Apenas leitura", icon: Eye },
];

export function TeamMembersManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("checkin_staff");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["producer-team", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_team_members")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("producer_id", user!.id)
        .order("invited_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("producer_team_members").insert({
        producer_id: user!.id,
        email,
        role,
        invite_token: token,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-team"] });
      setShowInvite(false);
      setEmail("");
      setRole("checkin_staff");
      toast({ title: "Convite enviado!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("producer_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-team"] });
      toast({ title: "Membro removido" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      const { error } = await supabase.from("producer_team_members").update({ role: newRole }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-team"] });
      toast({ title: "Papel atualizado" });
    },
  });

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>;
    if (status === "pending") return <Badge variant="secondary">Pendente</Badge>;
    return <Badge variant="destructive">Revogado</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-foreground">Equipe</h3>
          <p className="text-xs text-muted-foreground">Convide membros com permissões específicas</p>
        </div>
        <Button size="sm" onClick={() => setShowInvite(true)}><UserPlus className="h-4 w-4 mr-1" /> Convidar</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : members.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum membro convidado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {(m as any).profiles?.full_name || m.email}
                    </p>
                    {statusBadge(m.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={m.role} onValueChange={(v) => updateRoleMutation.mutate({ id: m.id, newRole: v })}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeMutation.mutate(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>O membro receberá acesso de acordo com o papel selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="membro@email.com" /></div>
            <div>
              <Label>Papel</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        role === r.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{r.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!email || inviteMutation.isPending}>
              <Mail className="h-4 w-4 mr-1" /> Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
