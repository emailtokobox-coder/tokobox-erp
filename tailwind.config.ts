/**
 * Tailwind CSS v4 shim configuration for shadcn/ui compatibility.
 *
 * Tailwind v4 uses CSS-first config (see app/globals.css), but shadcn/ui CLI
 * still reads application-level hints like baseColor and cssVariables from
 * this file via the components.json "tailwind.config" pointer.
 *
 * The Config type from "tailwindcss" only knows Tailwind-native keys, so we
 * satisfy the shadcn schema without strict Config typing.
 */

const shadcnSchema = {
  baseColor: "slate",
  cssVariables: true,
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
};

// Cast to avoid TS error (shadcn adds extra schema keys Tailwind v4 doesn't know).
export default shadcnSchema as Record<string, unknown>;
