"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink() {
    setStatus(null);
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setStatus({
        type: "success",
        text: "✅ Reset link sent! Check your inbox (and spam folder).",
      });
      setEmail("");
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-24">

        {/* Back link */}
        <a href="/login" className="text-sm text-white/50 hover:text-white transition">
          ← Back to Sign in
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="mt-2 text-white/60">
          Enter your registered email and we'll send you a reset link.
        </p>

        <div className="mt-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">

            <label className="block">
              <span className="text-sm font-medium text-white/80">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendLink()}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/15 transition"
                placeholder="you@email.com"
              />
            </label>

            {status && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-200"
                  : "border-red-500/20 bg-red-500/10 text-red-200"
              }`}>
                {status.text}
              </div>
            )}

            <button
              type="button"
              onClick={sendLink}
              disabled={loading}
              className={`w-full py-3 rounded-2xl font-semibold transition ${
                loading
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </div>

          <div className="border-t border-white/10 bg-black/20 px-6 py-4 text-xs text-white/50">
            The link will be sent to the email you used during registration.
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Remembered your password?{" "}
          <a href="/login" className="text-white/70 hover:text-white transition font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}