import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventProductsAll, createEventProduct, deleteEventProduct } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
}

export function EventProductsManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState<number | "">("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["event-products", eventId],
    queryFn: () => getEventProductsAll(eventId),
  });

  const createMut = useMutation({
    mutationFn: () => createEventProduct({
      event_id: eventId,
      name: name.trim(),
      description: description.trim() || undefined,
      price,
      quantity_available: quantity === "" ? undefined : quantity,
      sort_order: products.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
      setName("");
      setDescription("");
      setPrice(0);
      setQuantity("");
      toast({ title: "Produto adicionado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteEventProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
      toast({ title: "Produto removido" });
    },
  });

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Produtos e Complementos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Venda itens extras junto com os ingressos: camisetas, vouchers de bar, estacionamento, etc.</p>

        {!isLoading && products.length > 0 && (
          <div className="space-y-2">
            {products.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(p.price)}
                    {p.quantity_available != null ? ` · ${p.quantity_sold}/${p.quantity_available} vendidos` : " · Ilimitado"}
                  </p>
                </div>
                <button onClick={() => deleteMut.mutate(p.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Novo produto</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Camiseta Oficial, Voucher Bar" maxLength={150} />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2} maxLength={500} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Preço (R$)</Label>
              <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Qtd. disponível (vazio = ilimitado)</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value === "" ? "" : parseInt(e.target.value) || 1)} placeholder="Ilimitado" />
            </div>
          </div>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!name.trim() || price <= 0 || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar produto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
