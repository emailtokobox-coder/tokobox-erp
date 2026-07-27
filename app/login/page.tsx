"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signInAction } from "@/lib/auth/actions";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registeredMessage = searchParams.get("registered")
    ? "Akun berhasil dibuat! Silakan cek email untuk konfirmasi sebelum login."
    : "";

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal masuk. Silakan coba lagi.");
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

          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="__action" value="signIn" />
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