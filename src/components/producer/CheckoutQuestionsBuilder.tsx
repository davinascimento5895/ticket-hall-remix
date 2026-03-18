import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["checkout-questions", eventId],
    queryFn: () => getCheckoutQuestions(eventId),
  });

  const [localQuestions, setLocalQuestions] = useState<typeof questions>([]);
  const [lastDeleted, setLastDeleted] = useState<{ question: any; index: number } | null>(null);

  // Keep local state in sync with server data
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const reorderMut = useMutation({
    mutationFn: (updated: any[]) => Promise.all(updated.map((q) => updateCheckoutQuestion(q.id, { sort_order: q.sort_order }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleReorder = (nextQuestions: any[]) => {
    const updated = nextQuestions.map((item, idx) => ({ ...item, sort_order: idx }));
    setLocalQuestions(updated);
    reorderMut.mutate(updated);
  };

  const moveQuestion = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= localQuestions.length) return;
    const updated = Array.from(localQuestions);
    const [moved] = updated.splice(index, 1);
    updated.splice(next, 0, moved);
    handleReorder(updated);
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    const { question, index } = lastDeleted;
    try {
      await createCheckoutQuestion({
        event_id: eventId,
        question: question.question,
        field_type: question.field_type,
        options: question.options,
        is_required: question.is_required,
        applies_to: question.applies_to,
        sort_order: index,
      });
      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });
      setLastDeleted(null);
    } catch (e: any) {
      toast({ title: "Erro ao desfazer", description: e.message, variant: "destructive" });
    }
  };

  const createMut = useMutation({
    mutationFn: (payload: {
      question: string;
      field_type: string;
      options: string[] | null;
      is_required: boolean;
      applies_to: string;
    }) => createCheckoutQuestion({
      ...payload,
      event_id: eventId,
      sort_order: localQuestions.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });
      setNewQuestion("");
      setNewOptions("");
      setNewRequired(false);
      setValidationError(null);
      toast({ title: "Pergunta adicionada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const isDuplicateQuestion = (text: string) => {
    const normalized = text.trim().toLowerCase();
    return localQuestions.some((q) => q.question?.trim().toLowerCase() === normalized);
  };

  const handleAddQuestion = () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) {
      setValidationError("Digite a pergunta antes de adicionar.");
      return;
    }

    if (isDuplicateQuestion(trimmed)) {
      setValidationError("Já existe uma pergunta igual.");
      return;
    }

    const opts = ["select", "radio", "checkbox"].includes(newFieldType) && newOptions.trim()
      ? newOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

    createMut.mutate({
      question: trimmed,
      field_type: newFieldType,
      options: opts,
      is_required: newRequired,
      applies_to: newAppliesTo,
    });
  };

  const deleteMut = useMutation({
    mutationFn: deleteCheckoutQuestion,
    onSuccess: (_data, id) => {
      const question = localQuestions.find((q) => q.id === id);
      const index = localQuestions.findIndex((q) => q.id === id);
      if (question && index !== -1) {
        setLastDeleted({ question, index });
      }

      queryClient.invalidateQueries({ queryKey: ["checkout-questions", eventId] });

      toast({
        title: "Pergunta removida",
        description: "Clique para desfazer",
        action: {
          label: "Desfazer",
          onClick: undoDelete,
        },
      });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Formulário de Participante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : localQuestions.length > 0 ? (
          <>
            {reorderMut.isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando ordem...</span>
              </div>
            )}
            <Reorder.Group
              axis="y"
              values={localQuestions}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {localQuestions.map((q: any, idx: number) => (
                <Reorder.Item
                  key={q.id}
                  value={q}
                  id={q.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 cursor-grab active:cursor-grabbing"
                  whileDrag={{ scale: 1.02 }}
                  layout
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{q.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {fieldTypes.find((f) => f.value === q.field_type)?.label} · {q.is_required ? "Obrigatório" : "Opcional"} · {q.applies_to === "order" ? "Por pedido" : "Por ingresso"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveQuestion(idx, -1);
                      }}
                      disabled={idx === 0 || reorderMut.isLoading}
                      className="rounded p-1 text-muted-foreground hover:bg-muted/50"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveQuestion(idx, 1);
                      }}
                      disabled={idx === localQuestions.length - 1 || reorderMut.isLoading}
                      className="rounded p-1 text-muted-foreground hover:bg-muted/50"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover pergunta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover <strong>"{q.question}"</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMut.mutate(q.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Nenhuma pergunta customizada. Adicione perguntas que serão exibidas no checkout.</p>
            <div className="mt-3 text-xs text-muted-foreground">
              Exemplos:
              <ul className="mt-1 space-y-1">
                <li>• Tamanho da camiseta</li>
                <li>• Restrição alimentar</li>
                <li>• Deseja receber newsletter?</li>
              </ul>
            </div>
          </div>
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
          <Button size="sm" onClick={handleAddQuestion} disabled={!newQuestion.trim() || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar pergunta
          </Button>
          {validationError && <p className="text-xs text-destructive">{validationError}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
