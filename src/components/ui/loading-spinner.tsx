import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const sizeMap = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
} as const;

type SpinnerSize = keyof typeof sizeMap;

interface SpinnerProps extends ComponentProps<"div"> {
  size?: SpinnerSize;
  color?: "primary" | "muted" | "success" | "warning" | "error";
}

function Spinner({
  className,
  size = "default",
  color = "primary",
  ...props
}: SpinnerProps) {
  const colorMap = {
    primary: "text-primary",
    muted: "text-muted-foreground",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        className={cn("animate-spin", sizeMap[size], colorMap[color])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
