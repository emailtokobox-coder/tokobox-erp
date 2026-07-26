"use client"

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createContext, useContext } from "react";
import type { ReactNode, ComponentProps } from "react";

/* ─── Context ─── */

interface DrawerContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "left" | "right" | "bottom";
  size: "sm" | "default" | "lg" | "full";
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("Drawer components must be used within <Drawer>");
  return ctx;
}

/* ─── Size Map ─── */

const sideSizeMap = {
  left: {
    sm: "w-80",
    default: "w-96",
    lg: "w-[28rem]",
    full: "w-full",
  },
  right: {
    sm: "w-80",
    default: "w-96",
    lg: "w-[28rem]",
    full: "w-full",
  },
  bottom: {
    sm: "h-64",
    default: "h-96",
    lg: "h-[28rem]",
    full: "h-full",
  },
} as const;

/* ─── Drawer ─── */

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right" | "bottom";
  size?: "sm" | "default" | "lg" | "full";
  children: ReactNode;
}

function Drawer({
  open = false,
  onOpenChange,
  side = "right",
  size = "default",
  children,
}: DrawerProps) {
  return (
    <DrawerContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}), side, size }}>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />
          {/* Panel */}
          <div
            data-slot="drawer-panel"
            data-side={side}
            data-size={size}
            className={cn(
              "bg-background fixed z-50 flex flex-col gap-4 shadow-lg duration-200 rounded-lg",
              side === "left" && "inset-y-0 left-0 h-full border-r",
              side === "right" && "inset-y-0 right-0 h-full border-l",
              side === "bottom" && "inset-x-0 bottom-0 w-full border-t",
              sideSizeMap[side][size]
            )}
          >
            {children}
          </div>
        </div>
      )}
    </DrawerContext.Provider>
  );
}

/* ─── Drawer Header ─── */

interface DrawerHeaderProps extends ComponentProps<"div"> {
  showClose?: boolean;
}

function DrawerHeader({ className, showClose = true, children, ...props }: DrawerHeaderProps) {
  const { onOpenChange } = useDrawer();

  return (
    <div
      data-slot="drawer-header"
      className={cn("flex items-center justify-between px-6 pt-6", className)}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {showClose && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </div>
  );
}

/* ─── Drawer Body ─── */

interface DrawerBodyProps extends ComponentProps<"div"> {}

function DrawerBody({ className, ...props }: DrawerBodyProps) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("flex-1 overflow-y-auto px-6", className)}
      {...props}
    />
  );
}

/* ─── Drawer Footer ─── */

interface DrawerFooterProps extends ComponentProps<"div"> {}

function DrawerFooter({ className, ...props }: DrawerFooterProps) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("flex items-center justify-end gap-2 px-6 pb-6", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerHeader, DrawerBody, DrawerFooter };
