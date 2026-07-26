import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "inline" | "card" | "full-page";
}

function ErrorState({
  title = "Terjadi kesalahan",
  description = "Kami tidak dapat memuat data. Silakan coba lagi.",
  action,
  className,
  variant = "inline",
}: ErrorStateProps) {
  const containerStyles = {
    inline: "py-8 text-center",
    card: "rounded-xl border border-destructive bg-destructive/5 p-8 text-center",
    "full-page": "flex flex-col items-center justify-center min-h-[400px] text-center px-4",
  };

  return (
    <div
      data-slot="error-state"
      data-variant={variant}
      className={cn(containerStyles[variant], className)}
    >
      <div
        data-slot="error-state-icon"
        className="mx-auto mb-4 text-destructive"
      >
        <AlertTriangle className="size-12" strokeWidth={1.5} />
      </div>
      <div data-slot="error-state-content" className="flex flex-col gap-1">
        <p
          data-slot="error-state-title"
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </p>
        <p
          data-slot="error-state-description"
          className="text-sm text-muted-foreground max-w-sm mx-auto"
        >
          {description}
        </p>
      </div>
      {action || (
        <div data-slot="error-state-action" className="mt-4">
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Coba lagi
          </Button>
        </div>
      )}
    </div>
  );
}

export { ErrorState };
