"use client"

import type { ReactNode } from "react";


interface SWRProviderProps {
  children: ReactNode;
}

/**
 * SWRProvider — wraps the app for SWR data fetching.
 *
 * Currently a stub. SWRProvider from 'swr/react' will be used
 * once SWR is installed and configured with a custom fetcher.
 */
function SWRProvider({ children }: SWRProviderProps) {
  return <>{children}</>;
}

export { SWRProvider };
