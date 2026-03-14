/**
 * Empty state placeholder UI.
 *
 * Displayed when a list has no items (e.g. no patients, no notes, no labs).
 * Shows an optional icon in a circular badge, a title, description, and
 * an optional action element (e.g. a button to add the first item).
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 text-primary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
