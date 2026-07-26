import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        elevated:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
        flat:
          "bg-primary text-primary-foreground shadow-none hover:bg-primary/80",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface CommonButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string;
  loading?: boolean;
  error?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

type ButtonElementProps = CommonButtonProps & Omit<ComponentProps<"button">, keyof CommonButtonProps>;
type ButtonLinkProps = CommonButtonProps & Omit<ComponentProps<typeof Link>, keyof CommonButtonProps> & { href: string };

const Button = ({
  variant = "default" as const,
  size = "default" as const,
  loading = false,
  error = false,
  fullWidth = false,
  children,
  className,
  ...rest
}: ButtonElementProps | ButtonLinkProps) => {
  const isLink = "href" in rest && typeof (rest as ButtonLinkProps).href === "string";

  const baseClasses = buttonVariants({
    variant,
    size,
  });

  const finalClassName = cn(
    baseClasses,
    fullWidth && "w-full",
    error && variant !== "destructive" && "border-destructive text-destructive",
    loading && "cursor-wait",
    className
  );

  if (isLink) {
    return (
      <Link href={(rest as ButtonLinkProps).href} className={finalClassName}>
        {loading ? <Loader2 className="size-4 animate-spin shrink-0" /> : children}
      </Link>
    );
  }

  const buttonProps = rest as Omit<ButtonElementProps, keyof CommonButtonProps>;
  return (
    <button
      className={finalClassName}
      disabled={loading || (buttonProps.disabled ?? false)}
      aria-busy={loading ? "true" : undefined}
      aria-invalid={error ? "true" : undefined}
      {...buttonProps}
    >
      {loading ? <Loader2 className="size-4 animate-spin shrink-0" /> : children}
    </button>
  );
};

export { Button, buttonVariants };
