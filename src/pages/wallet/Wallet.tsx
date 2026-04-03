import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  TrendingUp,
  Landmark
} from "lucide-react";
import { formatBRL, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Wallet {
  id: string;
  available_balance: number;
  pending_balance: number;
  locked_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

export default function Wallet() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj" | "email" | "phone" | "random">("cpf");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Buscar carteira
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Wallet | null;
    },
    enabled: !!user,
  });

  // Buscar transações
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!wallet?.id,
  });

  // Buscar saques
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["wallet-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_withdrawals")
        .select("*")
        .eq("user_id", user!.id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as WithdrawalRequest[];
    },
    enabled: !!user,
  });

  // Mutação de saque
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Valor inválido");
      }
      if (amount > (wallet?.available_balance || 0)) {
        throw new Error("Saldo insuficiente");
      }

      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: { 
          amount, 
          pixKey, 
          pixKeyType 
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: t('wallet.withdrawalRequested2'),
        description: t('wallet.withdrawalRequestReceived'),
      });
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
    },
    onError: (error: any) => {
      toast({
        title: t('wallet.withdrawalRequestError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "resale_credit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "refund":
        return <RefreshCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "resale_credit":
        return "Venda no marketplace";
      case "withdrawal":
        return "Saque";
      case "refund":
        return "Reembolso";
      default:
        return type;
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />{t('common.pending2')}</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-blue-600"><RefreshCcw className="h-3 w-3 mr-1" />{t('common.processing2')}</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />{t('common.completed')}</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600"><AlertCircle className="h-3 w-3 mr-1" />{t('common.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <SEOHead title={t('wallet.pageTitle')} />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container pt-24 pb-20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              Minha Carteira
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus ganhos com revendas de ingressos
            </p>
          </div>

          {/* Cards de saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{t('wallet.available')}</Badge>
                </div>
                {walletLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <>
                    <p className="text-3xl font-bold">{formatBRL(wallet?.available_balance || 0)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Disponível para saque
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <Badge variant="outline">{t('orders.statusPending')}</Badge>
                </div>
                {walletLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <>
                    <p className="text-3xl font-bold">{formatBRL(wallet?.pending_balance || 0)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aguardando liberação
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Landmark className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge variant="outline">{t('common.total')}</Badge>
                </div>
                {walletLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <>
                    <p className="text-3xl font-bold">{formatBRL((wallet?.available_balance || 0) + (wallet?.pending_balance || 0))}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Saldo total
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              size="lg"
              disabled={!wallet || wallet.available_balance <= 0}
              onClick={() => setWithdrawDialogOpen(true)}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Sacar dinheiro
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/revenda">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Ir para marketplace
              </Link>
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="transactions">
            <TabsList className="mb-6">
              <TabsTrigger value="transactions">{t('wallet.transactions')}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t('wallet.withdrawals')}</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.transactionHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.type')}</TableHead>
                          <TableHead>{t('common.description')}</TableHead>
                          <TableHead>{t('common.date')}</TableHead>
                          <TableHead className="text-right">{t('common.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(tx.type)}
                                <span>{getTransactionLabel(tx.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {tx.description}
                            </TableCell>
                            <TableCell>
                              {formatDate(tx.created_at)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              tx.type === "resale_credit" ? "text-green-600" : 
                              tx.type === "withdrawal" ? "text-red-600" : ""
                            }`}>
                              {tx.type === "withdrawal" ? "-" : "+"}
                              {formatBRL(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>{t('wallet.noTransactionsFound')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <CardTitle>{t('wallet.withdrawalHistory2')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawalsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : withdrawals && withdrawals.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.status')}</TableHead>
                          <TableHead>{t('common.amount')}</TableHead>
                          <TableHead>{t('wallet.pixKey')}</TableHead>
                          <TableHead>{t('wallet.requestedOn2')}</TableHead>
                          <TableHead>{t('wallet.processedOn')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell>{getWithdrawalStatusBadge(w.status)}</TableCell>
                            <TableCell className="font-medium">
                              {formatBRL(w.net_amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {w.pix_key}
                            </TableCell>
                            <TableCell>
                              {formatDate(w.requested_at)}
                            </TableCell>
                            <TableCell>
                              {w.processed_at ? formatDate(w.processed_at) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Landmark className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>{t('wallet.noWithdrawalsFound')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </div>

      {/* Dialog de saque */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wallet.withdrawMoneyButton')}</DialogTitle>
            <DialogDescription>
              Saldo disponível: {formatBRL(wallet?.available_balance || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="amount">{t('wallet.withdrawalAmount')}</Label>
              <Input
                id="amount"
                type="number"
                min={10}
                max={wallet?.available_balance || 0}
                step={0.01}
                placeholder={t('common.zeroAmount')}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo: R$ 10,00
              </p>
            </div>

            <div>
              <Label htmlFor="pixType">{t('wallet.pixKeyType')}</Label>
              <Select value={pixKeyType} onValueChange={(v: any) => setPixKeyType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">{t('common.cpf')}</SelectItem>
                  <SelectItem value="cnpj">{t('common.cnpj')}</SelectItem>
                  <SelectItem value="email">{t('common.email')}</SelectItem>
                  <SelectItem value="phone">{t('common.phone2')}</SelectItem>
                  <SelectItem value="random">{t('wallet.randomKey2')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pixKey">{t('wallet.pixKey')}</Label>
              <Input
                id="pixKey"
                placeholder={t('wallet.enterPixKey')}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">{t('common.important')}</p>
              <ul className="text-muted-foreground space-y-1">
                <li>{t('wallet.withdrawalProcessingTime')}</li>
                <li>{t('wallet.withdrawalConfirmationEmail')}</li>
                <li>{t('wallet.verifyPixKey')}</li>
              </ul>
            </div>

            <Button
              className="w-full"
              disabled={!withdrawAmount || !pixKey || withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate()}
            >
              {withdrawMutation.isPending ? "Processando..." : "Confirmar saque"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
