import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ eyebrow = "Admin", title, description, actions, children, className }: AdminPageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm md:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-border/40" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit border-border/80 bg-background/70 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </Badge>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children ? <div className="relative mt-5">{children}</div> : null}
    </section>
  );
}