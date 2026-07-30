"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signInAction } from "@/lib/auth/actions";
import { useSession } from "@/components/providers/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const registeredMessage = searchParams.get("registered")
    ? "Akun berhasil dibuat! Silakan cek email untuk konfirmasi sebelum login."
    : "";

  if (session) {
    router.push("/dashboard");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signInAction(formData);
      if (result && "error" in result) {
        setServerError(result.error);
        setLoading(false);
      }
    } catch {
      setServerError("Gagal masuk. Silakan coba lagi.");
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
          {serverError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4" role="alert">
              {serverError}
            </div>
          )}
          {registeredMessage && !serverError && (
            <div className="bg-green-500/10 text-green-700 text-sm p-3 rounded mb-4" role="alert">
              {registeredMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input id="email" name="email" type="email" label="Email" placeholder="nama@email.com" required />
            </div>

            <div className="space-y-2">
              <Input id="password" name="password" type="password" label="Password" placeholder="••••••" required />
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
