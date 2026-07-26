"use client"

import { useState, useEffect } from "react";
import type { ReactNode } from "react";


import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ─── Position Map ─── */

const positionMap = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-4 right-4",
} as const;

type ToastPosition = keyof typeof positionMap;

/* ─── Toast Props ─── */

interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error";
  onClose?: () => void;
  className?: string;
  position?: ToastPosition;
  duration?: number;
  action?: ReactNode;
}

const variantStyles: Record<string, string> = {
  default: "bg-background border-border text-foreground",
  success: "bg-success/10 border-success/30 text-success-foreground dark:text-success",
  warning: "bg-warning/10 border-warning/30 text-warning-foreground dark:text-warning",
  error: "bg-error/10 border-error/30 text-error-foreground dark:text-error",
};

function Toast({
  title,
  description,
  variant = "default",
  onClose,
  className,
  position = "bottom-right",
  duration = 5000,
  action,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      data-slot="toast"
      data-position={position}
      data-state={isExiting ? "exiting" : "entered"}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-sm transition-all",
        variantStyles[variant],
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        className
      )}
      role="alert"
    >
      <div data-slot="toast-content" className="flex-1 min-w-0">
        {title && (
          <p data-slot="toast-title" className="text-sm font-medium">
            {title}
          </p>
        )}
        {description && (
          <p data-slot="toast-description" className="text-sm text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
        {action && (
          <div data-slot="toast-action" className="mt-2">
            {action}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Close notification"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ─── Toast Container ─── */

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "success" | "warning" | "error";
    action?: ReactNode;
  }>;
  onDismiss: (id: string) => void;
  className?: string;
  position?: ToastPosition;
}

function ToastContainer({ toasts, onDismiss, className, position = "bottom-right" }: ToastContainerProps) {
  return (
    <div
      data-slot="toast-container"
      data-position={position}
      className={cn("fixed z-50 flex flex-col gap-2 max-w-sm", positionMap[position], className)}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => onDismiss(toast.id)}
          position={position}
          action={toast.action}
        />
      ))}
    </div>
  );
}

export { Toast, ToastContainer };
