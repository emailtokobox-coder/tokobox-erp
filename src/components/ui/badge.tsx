import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white shadow-xs",
        outline:
          "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground shadow-xs",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow-xs",
      },
      dot: {
        true: "pl-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  }
);

const dotColorMap: Record<string, string> = {
  default: "bg-primary-foreground",
  secondary: "bg-secondary-foreground",
  destructive: "bg-white",
  success: "bg-success-foreground",
  warning: "bg-warning-foreground",
  outline: "bg-foreground",
};

function Badge({
  className,
  variant,
  dot = false,
  children,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span
      data-slot="badge"
      data-dot={dot ? "true" : undefined}
      className={cn(badgeVariants({ variant, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          data-slot="badge-dot"
          className={cn("size-1.5 rounded-full shrink-0", dotColorMap[variant || "default"])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
