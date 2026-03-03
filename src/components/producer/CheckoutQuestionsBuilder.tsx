import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCheckoutQuestions, createCheckoutQuestion, updateCheckoutQuestion, deleteCheckoutQuestion } from "@/lib/api-checkout";
import { toast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
}

const fieldTypes = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "select", label: "Lista suspensa" },
  { value: "checkbox", label: "Caixa de seleção" },
  { value: "radio", label: "Escolha única" },
  { value: "date", label: "Data" },
];

export function CheckoutQuestionsBuilder({ eventId }: Props) {
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newOptions, setNewOptions] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newAppliesTo, setNewAppliesTo] = useState("order");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["checkout-questions", eventId],
    queryFn: () => getCheckoutQuestions(eventId),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const opts = ["select", "radio", "checkbox"].includes(newFieldType) && newOptions.trim()
        ? newOptions.split(",").map((o) => o.trim()).filter(Boolean)
        : null;
      return createCheckoutQuestion({
        event_id: eventId,
        question: newQuestion.trim(),
        field_type: newFieldType,
        options: opts,
        is_required: newRequired,
        applies_to: newAppliesTo,
        sort_order: questions.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });
      setNewQuestion("");
      setNewOptions("");
      setNewRequired(false);
      toast({ title: "Pergunta adicionada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCheckoutQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });
      toast({ title: "Pergunta removida" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Formulário de Participante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((q: any) => (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                  <p className="text-xs text-muted-foreground">
                    {fieldTypes.find((f) => f.value === q.field_type)?.label} · {q.is_required ? "Obrigatório" : "Opcional"} · {q.applies_to === "order" ? "Por pedido" : "Por ingresso"}
                  </p>
                </div>
                <button onClick={() => deleteMut.mutate(q.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma pergunta customizada. Adicione perguntas que serão exibidas no checkout.</p>
        )}

        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Nova pergunta</p>
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ex: Tamanho da camiseta, Restrição alimentar..."
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo de campo</Label>
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Aplica-se a</Label>
              <Select value={newAppliesTo} onValueChange={setNewAppliesTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Por pedido</SelectItem>
                  <SelectItem value="attendee">Por ingresso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {["select", "radio", "checkbox"].includes(newFieldType) && (
            <div>
              <Label className="text-xs">Opções (separadas por vírgula)</Label>
              <Input value={newOptions} onChange={(e) => setNewOptions(e.target.value)} placeholder="P, M, G, GG" maxLength={500} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={newRequired} onCheckedChange={setNewRequired} />
            <Label className="text-xs">Campo obrigatório</Label>
          </div>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!newQuestion.trim() || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar pergunta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
