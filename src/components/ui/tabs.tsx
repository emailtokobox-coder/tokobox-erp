"use client"

import { createContext, useContext, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── Context ─── */

interface TabsContextValue {
  activeValue: string;
  onSelect: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

/* ─── Tabs ─── */

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, defaultValue, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  const activeValue = value ?? internalValue;

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeValue, onSelect: handleChange }}>
      <div data-slot="tabs" className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/* ─── TabsList ─── */

interface TabsListProps extends ComponentProps<"div"> {}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted/50 p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

/* ─── TabsTrigger ─── */

interface TabsTriggerProps extends ComponentProps<"button"> {
  value: string;
}

function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { activeValue, onSelect } = useTabsContext();
  const isActive = value === activeValue;

  return (
    <button
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      role="tab"
      aria-selected={isActive}
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
        className
      )}
      onClick={() => onSelect(value)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── TabsContent ─── */

interface TabsContentProps extends ComponentProps<"div"> {
  value: string;
}

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { activeValue } = useTabsContext();

  if (value !== activeValue) return null;

  return (
    <div
      data-slot="tabs-content"
      data-state="active"
      role="tabpanel"
      className={cn("mt-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
