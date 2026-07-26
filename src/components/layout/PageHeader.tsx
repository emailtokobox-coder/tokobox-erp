import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  className?: string;
}

function PageHeader({ title, description, action, breadcrumb, className }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-2 px-6 py-4", className)}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <nav data-slot="page-header-breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div data-slot="page-header-content" className="flex items-center justify-between gap-4">
        <div data-slot="page-header-text">
          <h1 data-slot="page-header-title" className="text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p data-slot="page-header-description" className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {action && <div data-slot="page-header-action">{action}</div>}
      </div>
    </header>
  );
}

export { PageHeader };
