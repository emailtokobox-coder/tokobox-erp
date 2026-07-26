"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { getSessionAction, getCurrentUserAction } from "@/lib/auth/actions";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Session {
  id: string;
  email: string;
}

interface User extends Session {
  avatarInitials: string;
}

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/* ─── Context ──────────────────────────────────────────────────────────────── */

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Hook to consume session state in client components.
 * @throws Error if used outside of SessionProvider
 */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

/* ─── Provider ─────────────────────────────────────────────────────────────── */

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider — wraps the app for Supabase session tracking.
 *
 * Responsibilities:
 *   1. Fetch initial session via server action (getSessionAction).
 *   2. Refresh on page visibility change and window focus.
 *   3. Provide session/user state + signOut callback to descendants.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session data from server actions
  const fetchSession = useCallback(async () => {
    try {
      const sessionData = await getSessionAction();
      const userData = await getCurrentUserAction();

      if (sessionData && userData) {
        const sessionObj: Session = { id: sessionData.id, email: sessionData.email || "" };
        const userObj: User = { ...userData, id: sessionData.id, email: sessionData.email || "" };
        setSession(sessionObj);
        setUser(userObj);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.error("Session fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Refresh on visibility change (tab switch, alt+tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSession();
      }
    };

    const handleFocus = () => {
      fetchSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchSession]);

  // Client-side sign out — uses Supabase client directly
  const signOut = useCallback(async () => {
    try {
      // Use dynamic import to avoid SSR issues
      const { createSupabaseClient } = await import("@/lib/supabase/client");
      const client = createSupabaseClient();
      await client.auth.signOut();
      setSession(null);
      setUser(null);
      // Redirect to login after sign out
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, []);

  // Loading state — show spinner while session is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
