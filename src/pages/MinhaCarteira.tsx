import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowDownToLine, Clock3, Lock, RefreshCcw } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserWalletSummary, requestWalletWithdrawal } from "@/lib/api-wallet";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  requested: "Solicitado",
  under_review: "Em revisão",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  cancelled: "Cancelado",
  pending: "Pendente",
  available: "Disponível",
  locked: "Bloqueado",
  completed: "Concluído",
  reversed: "Revertido",
};

export default function MinhaCarteira() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("random");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["user-wallet-summary"],
    queryFn: () => getUserWalletSummary(),
    staleTime: 15_000,
  });

  const withdrawalMutation = useMutation({
    mutationFn: () => requestWalletWithdrawal({
      amount: Number(amount),
      pixKey,
      pixKeyType,
    }),
    onSuccess: (result) => {
      if (!result.success) {
        toast({ title: "Erro no saque", description: result.error || "Tente novamente", variant: "destructive" });
        return;
      }

      toast({
        title: "Saque solicitado",
        description: `Líquido estimado: ${formatBRL(Number(result.netAmount || 0))}`,
      });
      setAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["user-wallet-summary"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message || "Erro ao solicitar saque", variant: "destructive" });
    },
  });

  const wallet = data?.wallet;

  const canWithdraw = useMemo(() => {
    return Number(amount) > 0 && pixKey.trim().length >= 3 && Number(wallet?.available_balance || 0) >= Number(amount);
  }, [amount, pixKey, wallet?.available_balance]);

  return (
    <>
      <SEOHead title="Minha Carteira - TicketHall" description="Gerencie saldo, saques e extrato da revenda oficial." />

      <div className="container pt-4 lg:pt-24 pb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Minha Carteira</h1>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Saldo disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatBRL(Number(wallet?.available_balance || 0))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Saldo pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatBRL(Number(wallet?.pending_balance || 0))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Saldo bloqueado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatBRL(Number(wallet?.locked_balance || 0))}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-primary" /> Solicitar saque PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input type="number" min="1" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo da chave</Label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="random">Aleatória</option>
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Chave PIX</Label>
                <Input placeholder="Informe sua chave" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Taxa de saque: 1% (mínimo R$ 1,00). O valor é bloqueado até processamento.
            </p>

            <Button onClick={() => withdrawalMutation.mutate()} disabled={!canWithdraw || withdrawalMutation.isPending}>
              {withdrawalMutation.isPending ? "Solicitando..." : "Solicitar saque"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /> Extrato da carteira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.ledger || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem movimentações ainda.</p>
              ) : (
                (data?.ledger || []).map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{row.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${row.direction === "credit" ? "text-emerald-600" : "text-foreground"}`}>
                        {row.direction === "credit" ? "+" : "-"} {formatBRL(Number(row.amount || 0))}
                      </p>
                      <Badge variant="secondary">{statusLabel[row.status] || row.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Histórico de saques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.withdrawals || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum saque solicitado.</p>
              ) : (
                (data?.withdrawals || []).map((w) => (
                  <div key={w.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{formatBRL(Number(w.amount || 0))}</p>
                      <Badge variant="secondary">{statusLabel[w.status] || w.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Líquido: {formatBRL(Number(w.net_amount || 0))}</p>
                    <p className="text-xs text-muted-foreground">Solicitado em {new Date(w.created_at).toLocaleString("pt-BR")}</p>
                    {w.failure_reason && <p className="text-xs text-destructive mt-1">{w.failure_reason}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
