import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type LegalSummaryItem = {
  label: string;
  value: string;
  detail: string;
};

export type LegalAction = {
  label: string;
  href: string;
  variant?: "default" | "outline";
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

type LegalDocumentPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  summary: LegalSummaryItem[];
  actions: LegalAction[];
  sections: LegalSection[];
  footerNote?: ReactNode;
};

export function LegalDocumentPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  summary,
  actions,
  sections,
  footerNote,
}: LegalDocumentPageProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);

        if (visible.length === 0) {
          return;
        }

        visible.sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="relative overflow-hidden pt-28 pb-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_30%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.10),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,hsl(var(--primary)/0.08),transparent)]" />

      <div className="relative container max-w-7xl">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg text-balance">
                {description}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Última atualização: {lastUpdated}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/25"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-3 font-display text-lg font-semibold text-foreground">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button key={action.href} asChild variant={action.variant ?? "default"} size="lg">
                <Link to={action.href}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sumário
              </p>
              <nav className="mt-4 space-y-1">
                {sections.map(({ id, title: sectionTitle }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      activeSection === id
                        ? "border-primary/20 bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                    )}
                    aria-current={activeSection === id ? "true" : undefined}
                  >
                    {sectionTitle}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="lg:hidden mb-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 pb-2">
                {sections.map(({ id, title: sectionTitle }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors",
                      activeSection === id
                        ? "border-primary/20 bg-primary/5 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {sectionTitle}
                  </button>
                ))}
              </div>
            </div>

            <article className="space-y-6">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-32 rounded-3xl border border-border bg-card/75 p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.id}-p-${index}`}>{paragraph}</p>
                    ))}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-2 pl-5">
                        {section.bullets.map((bullet, index) => (
                          <li key={`${section.id}-b-${index}`} className="list-disc">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.note ? (
                      <p className="rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
                        {section.note}
                      </p>
                    ) : null}
                  </div>
                </section>
              ))}
            </article>

            {footerNote ? (
              <div className="mt-10 rounded-3xl border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground">
                {footerNote}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}