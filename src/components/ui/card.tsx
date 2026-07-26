import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";

const elevationMap = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

const paddingMap = {
  none: "",
  compact: "p-4",
  default: "p-6",
  spacious: "p-8",
} as const;

type Elevation = keyof typeof elevationMap;
type Padding = keyof typeof paddingMap;

interface CardProps extends ComponentProps<"div"> {
  elevation?: Elevation;
  padding?: Padding;
  isLoading?: boolean;
  error?: boolean;
}

function Card({
  className,
  elevation = "sm",
  padding = "default",
  isLoading = false,
  error = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-elevation={elevation}
      className={cn(
        "bg-card text-card-foreground flex flex-col rounded-xl border",
        elevationMap[elevation],
        paddingMap[padding],
        error && "border-destructive",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 has-data-[slot=card-action]:flex-row has-data-[slot=card-action]:items-center has-data-[slot=card-action]:justify-between", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-lg", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex self-start items-center gap-1.5", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
};
