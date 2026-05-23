"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "likith200305@gmail.com";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === ADMIN_EMAIL) {
          router.replace("/admin");
        } else {
          setChecking(false);
        }
      } catch (err) {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  async function signIn() {
    setError(null);
    if (!password) {
      setError("Enter password");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError("Incorrect password");
      return;
    }

    setBusy(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signInError) {
        setError(`Login failed: ${signInError.message}`);
        setBusy(false);
        return;
      }

      router.replace("/admin");
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-[#07070A] text-white flex items-center justify-center px-4">
        <div className="text-white/40 text-sm animate-pulse">Checking...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070A] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
          <p className="mt-2 text-sm text-white/50">CityRing admin panel access.</p>

          <div className="mt-6 space-y-4">
            <div className="text-sm text-white/60 bg-white/5 p-3 rounded-xl border border-white/10">
              Email: <span className="font-mono text-white">{ADMIN_EMAIL}</span>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-white/80">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
                disabled={busy}
                autoFocus
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              onClick={signIn}
              disabled={busy}
              className={`w-full py-3 rounded-2xl font-semibold transition ${
                busy
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}