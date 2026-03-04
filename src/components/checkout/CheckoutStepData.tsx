import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CartItem } from "@/contexts/CartContext";
import { validateCPF, formatCPF } from "@/lib/validators";
import { toast } from "@/hooks/use-toast";

interface AttendeeEntry {
  name: string;
  email: string;
  cpf: string;
}

interface CheckoutStepDataProps {
  items: CartItem[];
  orderQuestions: any[];
  attendeeQuestions: any[];
  attendeeData: Record<string, AttendeeEntry>;
  setAttendeeData: React.Dispatch<React.SetStateAction<Record<string, AttendeeEntry>>>;
  questionAnswers: Record<string, string>;
  setQuestionAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onNext: () => void;
  isLoading: boolean;
}

export function CheckoutStepData({
  items,
  orderQuestions,
  attendeeQuestions,
  attendeeData,
  setAttendeeData,
  questionAnswers,
  setQuestionAnswers,
  onNext,
  isLoading,
}: CheckoutStepDataProps) {
  const renderQuestionField = (q: any, key: string) => {
    const value = questionAnswers[key] || "";
    const onChange = (val: string) =>
      setQuestionAnswers((prev) => ({ ...prev, [key]: val }));

    switch (q.field_type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Sua resposta..."
            rows={2}
            maxLength={1000}
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {(q.options || []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <div className="space-y-1">
            {(q.options || []).map((opt: string) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name={key}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="accent-primary"
                />
                <span className="text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-1">
            {(q.options || []).map((opt: string) => {
              const selected = value ? value.split(",") : [];
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const newSel = c
                        ? [...selected, opt]
                        : selected.filter((s) => s !== opt);
                      onChange(newSel.join(","));
                    }}
                  />
                  <span className="text-foreground">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Sua resposta..."
            maxLength={500}
          />
        );
    }
  };

  const handleValidateAndNext = () => {
    // Validate attendee data
    for (const item of items) {
      for (let qi = 0; qi < item.quantity; qi++) {
        const key = `${item.tierId}-${qi}`;
        const data = attendeeData[key];
        if (!data?.name?.trim()) {
          toast({
            title: "Dados incompletos",
            description: `Preencha o nome do participante para ${item.tierName} (Ingresso ${qi + 1})`,
            variant: "destructive",
          });
          return;
        }
        if (!data?.email?.trim() || !data.email.includes("@")) {
          toast({
            title: "Dados incompletos",
            description: `Preencha um e-mail válido para ${item.tierName} (Ingresso ${qi + 1})`,
            variant: "destructive",
          });
          return;
        }
        if (data?.cpf?.trim() && !validateCPF(data.cpf)) {
          toast({
            title: "CPF inválido",
            description: `O CPF informado para ${item.tierName} (Ingresso ${qi + 1}) é inválido`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Validate required questions
    const allQuestions = [...orderQuestions, ...attendeeQuestions];
    for (const q of allQuestions) {
      if (q.is_required) {
        const isOrder = q.applies_to === "order";
        if (isOrder) {
          const key = `order-${q.id}`;
          if (!questionAnswers[key]?.trim()) {
            toast({
              title: "Pergunta obrigatória",
              description: `Responda: "${q.question}"`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">
        Dados dos participantes
      </h2>

      {orderQuestions.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-card space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Informações do pedido
          </p>
          {orderQuestions.map((q: any) => (
            <div key={q.id}>
              <Label className="text-xs">
                {q.question}
                {q.is_required ? " *" : ""}
              </Label>
              {renderQuestionField(q, `order-${q.id}`)}
            </div>
          ))}
        </div>
      )}

      {items.map((item) =>
        Array.from({ length: item.quantity }).map((_, qi) => {
          const key = `${item.tierId}-${qi}`;
          const data = attendeeData[key] || { name: "", email: "", cpf: "" };
          return (
            <div
              key={key}
              className="p-4 rounded-lg border border-border bg-card space-y-3"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {item.eventTitle} — {item.tierName} (Ingresso {qi + 1})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome completo *</Label>
                  <Input
                    value={data.name}
                    onChange={(e) =>
                      setAttendeeData((p) => ({
                        ...p,
                        [key]: { ...data, name: e.target.value },
                      }))
                    }
                    placeholder="Nome do participante"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail *</Label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) =>
                      setAttendeeData((p) => ({
                        ...p,
                        [key]: { ...data, email: e.target.value },
                      }))
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">CPF (opcional)</Label>
                  <Input
                    value={data.cpf}
                    onChange={(e) =>
                      setAttendeeData((p) => ({
                        ...p,
                        [key]: { ...data, cpf: formatCPF(e.target.value) },
                      }))
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              {attendeeQuestions.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  {attendeeQuestions.map((q: any) => (
                    <div key={q.id}>
                      <Label className="text-xs">
                        {q.question}
                        {q.is_required ? " *" : ""}
                      </Label>
                      {renderQuestionField(q, `attendee-${key}-${q.id}`)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      <Button className="w-full" onClick={handleValidateAndNext} disabled={isLoading}>
        {isLoading ? "Criando pedido..." : "Continuar para pagamento"}
      </Button>
    </div>
  );
}
