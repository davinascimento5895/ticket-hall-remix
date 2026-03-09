import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import ProducerAccountsPayable from "./ProducerAccountsPayable";
import ProducerAccountsReceivable from "./ProducerAccountsReceivable";
import ProducerCashFlow from "./ProducerCashFlow";
import ProducerBankAccounts from "./ProducerBankAccounts";
import ProducerEventReconciliation from "./ProducerEventReconciliation";

export default function ProducerFinancial() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Financeiro</h1>

      <Tabs defaultValue="cashflow" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="reconciliation">Conferência</TabsTrigger>
          <TabsTrigger value="bank">Contas Bancárias</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="pt-4">
          <ProducerCashFlow producerId={user.id} />
        </TabsContent>
        <TabsContent value="receivable" className="pt-4">
          <ProducerAccountsReceivable producerId={user.id} />
        </TabsContent>
        <TabsContent value="payable" className="pt-4">
          <ProducerAccountsPayable producerId={user.id} />
        </TabsContent>
        <TabsContent value="reconciliation" className="pt-4">
          <ProducerEventReconciliation producerId={user.id} />
        </TabsContent>
        <TabsContent value="bank" className="pt-4">
          <ProducerBankAccounts producerId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
