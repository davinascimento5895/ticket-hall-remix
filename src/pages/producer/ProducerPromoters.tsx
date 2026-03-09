import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import ProducerPromotersList from "./ProducerPromotersList";
import ProducerPromoterCommissions from "./ProducerPromoterCommissions";
import ProducerPromoterRanking from "./ProducerPromoterRanking";

export default function ProducerPromoters() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Gestão de Promoters</h1>

      <Tabs defaultValue="promoters" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="promoters" className="pt-4">
          <ProducerPromotersList producerId={user.id} />
        </TabsContent>
        <TabsContent value="commissions" className="pt-4">
          <ProducerPromoterCommissions producerId={user.id} />
        </TabsContent>
        <TabsContent value="ranking" className="pt-4">
          <ProducerPromoterRanking producerId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
