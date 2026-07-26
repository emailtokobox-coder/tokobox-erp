import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div
          data-slot="empty-state-icon"
          className="text-muted-foreground"
        >
          {icon}
        </div>
      )}
      <div data-slot="empty-state-content" className="flex flex-col gap-1">
        <p
          data-slot="empty-state-title"
          className="text-sm font-medium text-foreground"
        >
          {title}
        </p>
        {description && (
          <p
            data-slot="empty-state-description"
            className="text-sm text-muted-foreground max-w-sm"
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <div data-slot="empty-state-action" className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
