"use client"

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createContext, useContext, useEffect } from "react";
import type { ReactNode, ComponentProps } from "react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

const SheetContext = createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

function useSheet() {
  const context = useContext(SheetContext);
  if (!context) throw new Error("Sheet components must be used within <Sheet>");
  return context;
}

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />
          {children}
        </div>
      )}
    </SheetContext.Provider>
  );
}

function SheetContent({ className, side = "right", children, ...props }: ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left" }) {
  const { onOpenChange } = useSheet();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onOpenChange]);

  const sideClasses: Record<string, string> = {
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full w-3/4 border-r",
    right: "inset-y-0 right-0 h-full w-3/4 border-l",
  };

  return (
    <div
      data-slot="sheet-content"
      className={cn(
        "bg-background fixed z-50 flex flex-col gap-4 shadow-lg transition-transform duration-300 rounded-lg",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
      >
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-6 pt-6", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 px-6 pb-6", className)}
      {...props}
    />
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter };
