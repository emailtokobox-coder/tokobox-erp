import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge className values with Tailwind CSS conflict resolution.
 *
 * Uses `clsx` for conditional class joining and `tailwind-merge`
 * to resolve conflicts (e.g. `p-4` vs `p-8` → keeps the last one).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
