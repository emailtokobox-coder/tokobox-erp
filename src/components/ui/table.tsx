import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown } from "lucide-react";
import { Children, isValidElement } from "react";
import type { ComponentProps, ReactNode } from "react";

const variantMap = {
  default: "",
  striped: "[&_tr:nth-child(even)]:bg-muted/30",
  bordered: "[&_tr]:border-b [&_tr]:border-border [&_td]:border-b [&_td]:border-border [&_th]:border-b [&_th]:border-border",
} as const;

const sizeMap = {
  sm: "text-xs [&_th]:h-8 [&_td]:h-8 [&_th]:px-2 [&_td]:px-2",
  default: "text-sm [&_th]:h-10 [&_td]:h-10 [&_th]:px-2 [&_td]:px-2",
  lg: "text-base [&_th]:h-12 [&_td]:h-12 [&_th]:px-4 [&_td]:px-4",
} as const;

type TableVariant = keyof typeof variantMap;
type TableSize = keyof typeof sizeMap;

interface TableProps extends ComponentProps<"table"> {
  variant?: TableVariant;
  size?: TableSize;
  isLoading?: boolean;
  loadingRowCount?: number;
  emptyState?: ReactNode;
}

function Table({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  loadingRowCount = 5,
  emptyState,
  children,
  ...props
}: TableProps) {
  const childArray = Children.toArray(children);
  const hasContent = childArray.some(
    (child) =>
      isValidElement(child) &&
      (child.type === TableBody || child.type === TableHeader || child.type === TableFooter)
  );

  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        data-variant={variant}
        className={cn(
          "w-full caption-bottom",
          variantMap[variant],
          sizeMap[size],
          className
        )}
        {...props}
      >
        {isLoading && !hasContent ? (
          <TableHeader>
            {Array.from({ length: loadingRowCount }).map((_, i) => (
              <TableRow key={`skeleton-header-${i}`}>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              </TableRow>
            ))}
          </TableHeader>
        ) : (
          children
        )}
      </table>
      {emptyState && !isLoading && !hasContent && (
        <div
          data-slot="table-empty-state"
          className="py-12 text-center text-muted-foreground"
        >
          {emptyState}
        </div>
      )}
    </div>
  );
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, sortable, sortDirection, onSort, children, ...props }: ComponentProps<"th"> & { sortable?: boolean; sortDirection?: "asc" | "desc" | null; onSort?: () => void }) {
  return (
    <th
      data-slot="table-head"
      data-sortable={sortable ? "true" : undefined}
      data-sort-direction={sortDirection || undefined}
      className={cn(
        "text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
        sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {children}
        {sortable && (
          <span className="text-muted-foreground/50" aria-hidden="true">
            <ArrowUpDown className="size-3.5" />
          </span>
        )}
      </div>
    </th>
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
