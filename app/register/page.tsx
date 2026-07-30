"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signUpAction } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signUpAction(formData);
      if (result && "error" in result) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError("Gagal mendaftar. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Buat Akun Baru</CardTitle>
          <CardDescription>Isi data di bawah untuk register ke TokoBox ERP</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input id="email" name="email" type="email" label="Email" placeholder="nama@email.com" required />
            </div>

            <div className="space-y-2">
              <Input id="password" name="password" type="password" label="Password" placeholder="minimal 8 karakter" minLength={8} required />
            </div>

            <div className="space-y-2">
              <Input id="confirmPassword" name="confirmPassword" type="password" label="Konfirmasi Password" required />
            </div>

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Sudah punya akun? Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
