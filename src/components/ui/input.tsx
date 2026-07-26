import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";

const sizeMap = {
  sm: "h-8 text-xs px-2.5 py-1",
  default: "h-9 text-sm px-3 py-1",
  lg: "h-10 text-base px-4 py-2",
} as const;

type InputSize = keyof typeof sizeMap;

interface InputProps extends ComponentProps<"input"> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: InputSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function Input({
  className,
  label,
  error,
  helperText,
  inputSize = "default",
  isLoading = false,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id || useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground mb-1.5 block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={props.type || "text"}
          data-slot="input"
          className={cn(
            "file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            sizeMap[inputSize],
            leftIcon && "pl-9",
            (rightIcon || isLoading) && "pr-9",
            error
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 aria-invalid:border-destructive"
              : "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          disabled={isLoading || props.disabled}
          {...props}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {rightIcon && !isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-destructive mt-1.5"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="text-sm text-muted-foreground mt-1.5"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

export { Input };
