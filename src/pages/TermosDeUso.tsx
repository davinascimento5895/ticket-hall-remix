import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, ShieldCheck, Store, Users } from "lucide-react";

const cards = [
  {
    title: "Termos para Clientes",
    description:
      "Regras para compra, acesso, revenda oficial, cancelamento, reembolso e uso dos ingressos pelos clientes finais.",
    href: "/termos-de-uso/cliente",
    icon: Users,
    accent: "from-primary/15 to-primary/5",
  },
  {
    title: "Termos para Produtores",
    description:
      "Regras para quem cria, publica, gerencia e recebe repasses dos eventos hospedados na TicketHall.",
    href: "/termos-de-uso/produtor",
    icon: Store,
    accent: "from-accent/15 to-accent/5",
  },
  {
    title: "Revenda oficial",
    description:
      "Resumo das regras de revenda habilitada pelo evento, com vínculo ao termo do cliente final.",
    href: "/termos-de-uso/cliente#revenda",
    icon: FileText,
    accent: "from-secondary/80 to-secondary/40",
  },
];

export default function TermosDeUso() {
  return (
    <>
      <SEOHead
        title="Termos de Uso — TicketHall"
        description="Escolha o documento correto: termo do cliente final, termo do produtor ou a política de revenda oficial da TicketHall."
      />

      <main className="relative overflow-hidden pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.12),transparent_26%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,hsl(var(--primary)/0.08),transparent)]" />

        <div className="relative container max-w-7xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Documento legal
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
                  Termos de Uso
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg text-balance">
                  A TicketHall separa os deveres por contexto para reduzir ambiguidades e reforçar a proteção da plataforma em toda a jornada. Se você compra ou participa de eventos, leia o termo do cliente. Se você cria e opera eventos, leia o termo do produtor. A revenda oficial continua vinculada ao documento do cliente final.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border bg-card px-3 py-1">Compra e acesso</span>
                  <span className="rounded-full border border-border bg-card px-3 py-1">Repasse e risco</span>
                  <span className="rounded-full border border-border bg-card px-3 py-1">Revenda oficial</span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Este hub não substitui os documentos completos. Ele existe para que o usuário chegue ao termo correto sem misturar regras de compra com regras de operação de evento. A versão completa e vigente sempre prevalece sobre resumos, banners ou mensagens de produto.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className={`rounded-3xl border border-border bg-gradient-to-br ${card.accent} p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/90 shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                  <Button asChild variant="outline" className="mt-5 w-full justify-between">
                    <Link to={card.href}>
                      Abrir documento
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          <div id="revenda" className="mt-12 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary/40">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl font-semibold text-foreground">Revenda oficial</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A revenda só existe quando o evento habilita essa função. Quando habilitada, o cliente deve usar apenas o fluxo oficial da TicketHall. A plataforma pode limitar preço, prazo, quantidade, taxa e critérios de elegibilidade, além de invalidar o código original e emitir um novo acesso quando a operação for concluída.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="default">
                    <Link to="/termos-de-uso/cliente#revenda">Ler regra completa da revenda</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/termos-de-uso/cliente">Ir para o termo do cliente</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Quando abrir este hub
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Use esta página para orientar quem não sabe se deve ler o termo do cliente ou o termo do produtor. Os links internos da plataforma apontam para o documento correto conforme o fluxo.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Suporte oficial
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Dúvidas operacionais e de cadastro podem ser enviadas para{" "}
                <a href="mailto:suporte@tickethall.com.br" className="text-primary hover:underline">
                  suporte@tickethall.com.br
                </a>
                . Questões de privacidade seguem a Política de Privacidade.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}