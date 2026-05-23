"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function MemberLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        // Check if member (not admin)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", data.session.user.email!)
          .maybeSingle();
        if (profile) router.replace("/dashboard");
      }
    });
  }, [router]);

  async function signIn() {
    if (!canSubmit) return;
    setBusy(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      // Verify they have a profile (are a member)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.user.email!)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("No membership found for this email. Please register first.");
      }

      router.replace("/dashboard");
    } catch (e: any) {
      setMsg(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

       

      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-blue-500/80" />
                Member Portal
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-2 text-sm text-white/60">
                Use the email and password you registered with.
              </p>

              {msg && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {msg}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/80">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@email.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && signIn()}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <button
                  onClick={signIn}
                  disabled={!canSubmit}
                  className={[
                    "w-full rounded-2xl py-3 font-semibold transition",
                    canSubmit
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10",
                  ].join(" ")}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 px-6 sm:px-8 py-4 flex items-center justify-between text-xs text-white/50">
              <span>Not registered yet?</span>
              <a href="/register" className="text-white/80 hover:text-white transition font-medium">
                Register →
              </a>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-white/30">
            Forgot password?{" "}
            <a href="/forgot-password" className="text-white/50 hover:text-white/80 transition">
              Reset it here
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}