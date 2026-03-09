import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getListBySlug, getListFields, submitToList, type InterestListField } from "@/lib/api-interest-lists";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { SEOHead } from "@/components/SEOHead";
import { Tag, MapPin, CalendarDays, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function InterestListPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: list, isLoading: loadingList, error: listError } = useQuery({
    queryKey: ["interest-list-public", slug],
    queryFn: () => getListBySlug(slug!),
    enabled: !!slug,
    retry: false,
  });

  const { data: fields = [] } = useQuery({
    queryKey: ["interest-list-fields-public", list?.id],
    queryFn: () => getListFields(list!.id),
    enabled: !!list?.id,
  });

  // Check if list is closed/expired/full
  const isClosed = list?.status === "closed";
  const isExpired = list?.expires_at ? new Date(list.expires_at) < new Date() : false;
  const isFull = list?.max_submissions ? list.submissions_count >= list.max_submissions : false;
  const isUnavailable = isClosed || isExpired || isFull;

  const validatePhone = (val: string) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(val.replace(/\s/g, ""));
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach((f: InterestListField) => {
      const val = (answers[f.field_name] || "").trim();
      if (f.is_required && !val) errs[f.field_name] = "Campo obrigatório";
      else if (f.field_type === "email" && val && !validateEmail(val)) errs[f.field_name] = "E-mail inválido";
      else if (f.field_type === "phone" && val && !validatePhone(val)) errs[f.field_name] = "Telefone inválido";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !list) return;
    setSubmitting(true);
    try {
      await submitToList(list.id, answers);
      setSuccess(true);
    } catch (err: any) {
      if (err.message === "DUPLICATE_EMAIL") {
        toast.error("Este e-mail já está inscrito nesta lista.");
      } else {
        toast.error("Erro ao enviar inscrição. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingList) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (listError || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Lista não encontrada</h1>
        <p className="text-sm text-muted-foreground mb-4">Esta lista não existe ou não está mais disponível.</p>
        <Link to="/">
          <Button variant="outline">Ir para a página inicial</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${list.name} — Lista de Interesse | TicketHall`}
        description={list.description || `Entre na lista de interesse: ${list.name}`}
      />
      <div className="min-h-screen bg-muted/30">
        {/* Banner */}
        <div className="relative w-full aspect-[3/1] max-h-[280px] bg-muted overflow-hidden rounded-b-xl">
          {list.image_url ? (
            <img src={list.image_url} alt={list.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <Badge className="absolute top-4 left-4 gap-1.5 bg-background/80 backdrop-blur-sm text-foreground">
            <Tag className="h-3 w-3" />
            Evento
          </Badge>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Title + meta */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{list.name}</h1>
            {(list.venue_name || list.start_date) && (
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {list.venue_name && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{list.venue_name}</span>
                )}
                {list.start_date && (
                  <>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(list.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(list.start_date), "HH:mm")}
                    </span>
                  </>
                )}
              </div>
            )}
            {list.description && (
              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{list.description}</p>
            )}
          </div>

          {/* Form or unavailable message */}
          {isUnavailable ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h2 className="text-lg font-semibold text-foreground">Esta lista não está mais recebendo inscrições</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFull ? "O limite de inscrições foi atingido." : isExpired ? "A data de expiração já passou." : "A lista foi encerrada pelo produtor."}
                </p>
              </CardContent>
            </Card>
          ) : success ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mb-3" />
                <h2 className="text-xl font-bold text-foreground">Inscrição confirmada!</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Você entrou na lista de interesse. Fique de olho no seu e-mail para novidades sobre este evento!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-bold text-foreground mb-1">Entre na lista de interesse!</h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Preencha o formulário pra entrar na lista do produtor. Importante: ainda não é a compra! Essa lista serve só pra avisar você quando tivermos novidades sobre o evento. Não garante ingresso nem preferência.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {fields.map((field: InterestListField) => (
                    <div key={field.field_name} className="space-y-1.5">
                      <Label className="text-sm">
                        {field.field_name}
                        {field.is_required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                      <Input
                        type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : field.field_type === "number" ? "number" : "text"}
                        placeholder={field.placeholder}
                        value={answers[field.field_name] || ""}
                        onChange={(e) => {
                          setAnswers({ ...answers, [field.field_name]: e.target.value });
                          if (errors[field.field_name]) setErrors({ ...errors, [field.field_name]: "" });
                        }}
                        className={errors[field.field_name] ? "border-destructive" : ""}
                      />
                      {errors[field.field_name] && (
                        <p className="text-xs text-destructive">{errors[field.field_name]}</p>
                      )}
                    </div>
                  ))}

                  <p className="text-xs text-muted-foreground pt-2">
                    Ao entrar na lista, você aceita os{" "}
                    <Link to="/termos-de-uso" className="font-semibold text-foreground underline underline-offset-2">Termos e Condições da TicketHall</Link>
                    {" "}e concorda em compartilhar os dados preenchidos com o produtor.
                  </p>

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Quero entrar na lista!
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex justify-center py-6">
            <Link to="/">
              <TicketHallLogo size="sm" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
