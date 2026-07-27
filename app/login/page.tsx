"use client";

/* ─── Dependencies & Imports ─────────────────────────────────────────────────────── */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

/* ─── LoginPage Component ────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registeredMessage = searchParams.get("registered")
    ? "Akun berhasil dibuat! Silakan cek email untuk konfirmasi sebelum login."
    : "";

  /* ─── Form Handler ────────────────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        /* ─── Map Supabase error codes to user-friendly messages ─────────────────── */
        const errorMessage =
          authError.message === "Invalid login credentials"
            ? "Email atau password salah."
            : authError.message === "Email not confirmed"
              ? "Email belum dikonfirmasi. Silakan cek inbox Anda."
              : "Gagal masuk. Silakan coba lagi.";
        
        throw new Error(errorMessage);
      }

      if (data.session) {
        router.push("/dashboard");
      } else {
        setError("Tidak ada sesi yang dibuat. Silakan coba lagi.");
        return;
      }
    } catch (err) {
      /* ─── Catch any errors and display them to user ───────────────────────────── */
      setError(
        err instanceof Error ? err.message : "Gagal masuk. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">TokoBox ERP</CardTitle>
          <CardDescription>Masuk ke akun Anda untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}
          {registeredMessage && (
            <div className="bg-green-500/10 text-green-700 text-sm p-3 rounded mb-4" role="alert">
              {registeredMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input id="email" name="email" type="email" label="Email" placeholder="nama@email.com" required />
            </div>

            <div className="space-y-2">
              <Input id="password" name="password" type="password" label="Password" required />
            </div>

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link href="/register" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              Belum punya akun? Daftar sekarang
            </Link>
            <Link href="/forgot-password" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
              Lupa password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
