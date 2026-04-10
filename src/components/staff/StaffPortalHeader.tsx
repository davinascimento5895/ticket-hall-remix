import { Fragment, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TicketHallLogo } from "@/components/TicketHallLogo";
import { cn } from "@/lib/utils";

type StaffMetric = {
  label: string;
  value: string;
  helper?: string;
};

type StaffBreadcrumbItem = {
  label: string;
  href?: string;
};

interface StaffPortalHeaderProps {
  breadcrumb: StaffBreadcrumbItem[];
  eyebrow?: string;
  title: string;
  description: string;
  accountName: string;
  accountEmail?: string | null;
  accountAvatarUrl?: string | null;
  activeRoleLabel: string;
  canSwitchToBuyer: boolean;
  onSwitchToBuyer: () => void;
  onSignOut: () => void;
  actions?: ReactNode;
  metrics?: StaffMetric[];
  className?: string;
}

function getInitials(name: string, email?: string | null) {
  const trimmedName = name.trim();

  if (trimmedName) {
    return trimmedName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "TH";
}

function MetricCard({ label, value, helper }: StaffMetric) {
  return (
    <Card className="border-border/80 bg-background/80 shadow-sm">
      <CardContent className="p-3.5 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold leading-tight text-foreground break-words">
          {value}
        </p>
        {helper && (
          <p className="mt-1 text-xs text-muted-foreground">
            {helper}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AccountPanel({
  accountName,
  accountEmail,
  accountAvatarUrl,
  activeRoleLabel,
  canSwitchToBuyer,
  onSwitchToBuyer,
  onSignOut,
}: Pick<StaffPortalHeaderProps, "accountName" | "accountEmail" | "accountAvatarUrl" | "activeRoleLabel" | "canSwitchToBuyer" | "onSwitchToBuyer" | "onSignOut">) {
  const initials = getInitials(accountName, accountEmail);

  return (
    <Card className="border-border/80 bg-background/85 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={accountAvatarUrl ?? undefined} alt={accountName} />
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {accountName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {accountEmail || "Sem e-mail"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.14em]">
                {activeRoleLabel}
              </Badge>
              {canSwitchToBuyer ? (
                <Badge variant="outline" className="text-[10px]">
                  Comprador disponível
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Sem perfil comprador
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {canSwitchToBuyer && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={onSwitchToBuyer}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Ir para comprador
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffPortalHeader({
  breadcrumb,
  eyebrow,
  title,
  description,
  accountName,
  accountEmail,
  accountAvatarUrl,
  activeRoleLabel,
  canSwitchToBuyer,
  onSwitchToBuyer,
  onSignOut,
  actions,
  metrics = [],
  className,
}: StaffPortalHeaderProps) {
  return (
    <section className={cn("sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <Link to="/staff" className="inline-flex items-center">
              <TicketHallLogo size="sm" />
            </Link>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Portal da equipe
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <Breadcrumb>
                <BreadcrumbList className="text-[11px] sm:text-xs">
                  {breadcrumb.map((item, index) => {
                    const isLast = index === breadcrumb.length - 1;

                    return (
                      <Fragment key={`${item.label}-${index}`}>
                        <BreadcrumbItem>
                          {item.href && !isLast ? (
                            <BreadcrumbLink asChild>
                              <Link to={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex flex-wrap items-center gap-2">
                {eyebrow && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {eyebrow}
                  </p>
                )}
                <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.14em]">
                  {activeRoleLabel}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              </div>

              {actions && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {actions}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserRound className="h-4 w-4" />
                    Conta
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[82dvh] overflow-y-auto rounded-t-3xl border-border/80 bg-background px-4 pb-6 pt-4 sm:px-6">
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-display text-xl">Conta conectada</SheetTitle>
                    <SheetDescription>
                      Confira quem está logado e alterne para o perfil de comprador quando precisar.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-5 space-y-4">
                    <AccountPanel
                      accountName={accountName}
                      accountEmail={accountEmail}
                      accountAvatarUrl={accountAvatarUrl}
                      activeRoleLabel={activeRoleLabel}
                      canSwitchToBuyer={canSwitchToBuyer}
                      onSwitchToBuyer={onSwitchToBuyer}
                      onSignOut={onSignOut}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <div className="hidden w-full max-w-sm lg:block">
              <AccountPanel
                accountName={accountName}
                accountEmail={accountEmail}
                accountAvatarUrl={accountAvatarUrl}
                activeRoleLabel={activeRoleLabel}
                canSwitchToBuyer={canSwitchToBuyer}
                onSwitchToBuyer={onSwitchToBuyer}
                onSignOut={onSignOut}
              />
            </div>
          </div>

          {/* metrics removed per design: consolidated account/info is in header */}
        </div>
      </div>
    </section>
  );
}
