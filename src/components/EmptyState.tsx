import { ReactNode, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { LucideProps } from "lucide-react";

interface EmptyStateProps {
  icon: ReactNode | ComponentType<LucideProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, children }: EmptyStateProps) {
  // Check if icon is a component (function) or a ReactNode
  const isComponent = typeof icon === "function";
  const IconComponent = isComponent ? (icon as ComponentType<LucideProps>) : null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-muted-foreground">
        {IconComponent ? <IconComponent className="h-12 w-12" /> : (icon as ReactNode)}
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {children}
    </div>
  );
}
