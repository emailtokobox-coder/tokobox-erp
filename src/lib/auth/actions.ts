"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// ─── Sign In ──────────────────────────────────────────────────────────────

export async function signInAction(formData: FormData): Promise<void | { error: string }> {
  const supabase = await createServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Email atau password salah."
        : error.message === "Email not confirmed"
          ? "Email belum dikonfirmasi. Silakan cek inbox Anda."
          : "Gagal masuk. Silakan coba lagi.";

    return { error: message };
  }

  if (data.session) {
    console.log("User signed in:", data.user?.email);
  }

  redirect("/dashboard");
}

// ─── Sign Up ──────────────────────────────────────────────────────────────

export async function signUpAction(formData: FormData): Promise<void | { error: string }> {
  const supabase = await createServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Semua field harus diisi." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Password dan konfirmasi password tidak cocok." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    const message =
      error.message.includes("User already registered")
        ? "Email sudah terdaftar. Silakan gunakan email lain atau login."
        : "Gagal mendaftar. Silakan coba lagi.";

    return { error: message };
  }

  if (data.user && !data.session) {
    console.log("Registration successful, awaiting email confirmation:", data.user.email);
  }

  redirect("/login?registered=true");
}

// ─── Get Current Session (for server components) ───────────────────────────

export async function getSessionAction() {
  const supabase = await createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
  };
}

// ─── Get Current User (with initials) ───────────────────────────────────────

export async function getCurrentUserAction() {
  const supabase = await createServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    avatarInitials: getAvatarInitials(session.user.email || ""),
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getAvatarInitials(email: string): string {
  if (!email) return "?";
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
}
