import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTicketTaxesFees, createTicketTaxFee, deleteTicketTaxFee } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";
import { formatBRL } from "@/lib/utils";

interface Props {
  eventId: string;
}

export function TaxesFeesManager({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [feeType, setFeeType] = useState("fixed");
  const [amount, setAmount] = useState(0);
  const [passedToBuyer, setPassedToBuyer] = useState(true);

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["ticket-taxes-fees", eventId],
    queryFn: () => getTicketTaxesFees(eventId),
  });

  const createMut = useMutation({
    mutationFn: () => createTicketTaxFee({
      event_id: eventId,
      name: name.trim(),
      fee_type: feeType,
      amount,
      is_passed_to_buyer: passedToBuyer,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-taxes-fees", eventId] });
      setName("");
      setAmount(0);
      toast({ title: "Taxa adicionada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTicketTaxFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-taxes-fees", eventId] });
      toast({ title: "Taxa removida" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taxas e Encargos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Adicione taxas extras por ingresso (ISS, conveniência, seguro). Separadas da taxa da plataforma (7%).</p>

        {!isLoading && fees.length > 0 && (
          <div className="space-y-2">
            {fees.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.fee_type === "percentage" ? `${f.amount}%` : formatBRL(Number(f.amount))}
                    {" · "}
                    {f.is_passed_to_buyer ? "Repassado ao comprador" : "Absorvido pelo produtor"}
                  </p>
                </div>
                <button onClick={() => deleteMut.mutate(f.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Nova taxa</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: ISS, Taxa de conveniência" maxLength={100} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={feeType} onValueChange={setFeeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valor</Label>
              <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={passedToBuyer} onCheckedChange={setPassedToBuyer} />
            <Label className="text-xs">Repassar ao comprador</Label>
          </div>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!name.trim() || amount <= 0 || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar taxa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
