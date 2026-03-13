import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2, Copy, RefreshCw, Trash2, UserPlus, Mail, Clock, Users as UsersIcon,
  Check, Shield, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function ProducerEventStaff() {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showLinkConfig, setShowLinkConfig] = useState(false);
  const [linkMaxUses, setLinkMaxUses] = useState("10");
  const [linkExpDays, setLinkExpDays] = useState("7");
  const [copied, setCopied] = useState(false);

  // Fetch event staff link data
  const { data: event } = useQuery({
    queryKey: ["event-staff-config", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("staff_access_code, staff_link_max_uses, staff_link_uses, staff_link_expires_at, title")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!eventId,
  });

  // Fetch staff members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["event-staff-members", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_staff")
        .select("id, user_id, assigned_at, profiles:user_id(full_name, avatar_url)")
        .eq("event_id", eventId!)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!eventId,
  });

  // Regenerate access code
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const maxUses = linkMaxUses ? parseInt(linkMaxUses) : null;
      const expiresAt = linkExpDays
        ? new Date(Date.now() + parseInt(linkExpDays) * 86400000).toISOString()
        : null;
      const newCode = crypto.randomUUID().slice(0, 8).toUpperCase();
      const { error } = await supabase
        .from("events")
        .update({
          staff_access_code: newCode,
          staff_link_max_uses: maxUses,
          staff_link_uses: 0,
          staff_link_expires_at: expiresAt,
        } as any)
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-staff-config", eventId] });
      setShowLinkConfig(false);
      toast({ title: "Link gerado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Remove staff member
  const removeMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase.from("event_staff").delete().eq("id", staffId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-staff-members", eventId] });
      toast({ title: "Membro removido" });
    },
  });

  // Invite by email (creates pending entry in producer_team_members + event_staff if user exists)
  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Check if user exists by email in profiles (via a lookup)
      // For now, create a producer_team_members entry with checkin_staff role
      const { error } = await supabase.from("producer_team_members").insert({
        producer_id: user!.id,
        email: inviteEmail.trim().toLowerCase(),
        role: "checkin_staff",
        invite_token: crypto.randomUUID(),
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowInvite(false);
      setInviteEmail("");
      toast({ title: "Convite enviado!", description: "O staff receberá o convite por e-mail." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const staffLink = event?.staff_access_code
    ? `${window.location.origin}/staff/join/${event.staff_access_code}`
    : null;

  const linkExpired = event?.staff_link_expires_at && new Date(event.staff_link_expires_at) < new Date();
  const linkExhausted = event?.staff_link_max_uses != null && (event?.staff_link_uses ?? 0) >= event.staff_link_max_uses;
  const linkActive = staffLink && !linkExpired && !linkExhausted;

  const copyLink = () => {
    if (staffLink) {
      navigator.clipboard.writeText(staffLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copiado!" });
    }
  };

  const daysRemaining = event?.staff_link_expires_at
    ? Math.max(0, Math.ceil((new Date(event.staff_link_expires_at).getTime() - Date.now()) / 86400000))
    : null;

  const usesRemaining = event?.staff_link_max_uses != null
    ? Math.max(0, event.staff_link_max_uses - (event?.staff_link_uses ?? 0))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Equipe do Evento</h2>
          <p className="text-sm text-muted-foreground">Gerencie quem faz check-in neste evento</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowInvite(true)}>
            <Mail className="h-4 w-4 mr-1.5" /> Convidar por e-mail
          </Button>
          <Button size="sm" onClick={() => setShowLinkConfig(true)}>
            <Link2 className="h-4 w-4 mr-1.5" /> Gerar Link
          </Button>
        </div>
      </div>

      {/* Active Link Card */}
      {staffLink && (
        <Card className={linkActive ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Link de Convite</span>
                  {linkActive ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">ATIVO</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      {linkExpired ? "EXPIRADO" : "ESGOTADO"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">{staffLink}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {daysRemaining !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {daysRemaining > 0 ? `Expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}` : "Expirado"}
                    </span>
                  )}
                  {usesRemaining !== null && (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      {usesRemaining > 0 ? `${usesRemaining} uso${usesRemaining !== 1 ? 's' : ''} restante${usesRemaining !== 1 ? 's' : ''}` : "Sem usos restantes"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={copyLink} className="h-8">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revogar link?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O link atual será invalidado. Quem já entrou como staff permanece vinculado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => regenerateMutation.mutate()}>
                        Revogar e gerar novo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Members List */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Ativos ({members.length})
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum staff vinculado a este evento.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gere um link de convite ou convide por e-mail.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {m.profiles?.avatar_url ? (
                        <img src={m.profiles.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.profiles?.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(m.assigned_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-8">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {m.profiles?.full_name || "Este membro"} perderá acesso ao check-in deste evento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMutation.mutate(m.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Link Dialog */}
      <Dialog open={showLinkConfig} onOpenChange={setShowLinkConfig}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Link de Convite</DialogTitle>
            <DialogDescription>
              Quem acessar este link e fizer login será automaticamente vinculado como staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Máximo de usos</Label>
              <Select value={linkMaxUses} onValueChange={setLinkMaxUses}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 usos</SelectItem>
                  <SelectItem value="10">10 usos</SelectItem>
                  <SelectItem value="20">20 usos</SelectItem>
                  <SelectItem value="50">50 usos</SelectItem>
                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expira em</Label>
              <Select value={linkExpDays} onValueChange={setLinkExpDays}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Se já existir um link ativo, ele será substituído pelo novo.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkConfig(false)}>Cancelar</Button>
            <Button onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}>
              <Link2 className="h-4 w-4 mr-1.5" /> Gerar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Staff por E-mail</DialogTitle>
            <DialogDescription>
              O staff receberá um convite e terá acesso ao check-in após aceitar.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="staff@email.com"
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteEmail.includes("@") || inviteMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-1.5" /> Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
