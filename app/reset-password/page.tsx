"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function init() {
      // Read both query params and hash params (mobile strips hash, desktop keeps it)
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));

      const errorCode = params.get("error_code") || hashParams.get("error_code");
      const errorDesc = params.get("error_description") || hashParams.get("error_description");

      if (errorCode) {
        setLinkError(
          errorCode === "otp_expired"
            ? "This reset link has expired. Please request a new one."
            : errorDesc?.replace(/\+/g, " ") || "Invalid reset link. Please request a new one."
        );
        await supabase.auth.signOut();
        return;
      }

      // Method 1: token_hash in query params (mobile-friendly, newer Supabase format)
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) {
          setLinkError("This reset link is invalid or has expired. Please request a new one.");
          return;
        }
        setSessionReady(true);
        return;
      }

      // Method 2: access_token in hash (desktop format)
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setLinkError("This reset link is invalid or has expired. Please request a new one.");
          return;
        }
        // Sign out after session restore so navbar doesn't show logged in
        await supabase.auth.signOut();
        setSessionReady(true);
        return;
      }

      // No token found at all
      setLinkError("No reset token found. Please use the link from your email.");
    }

    init();
  }, []);

  async function save() {
    setStatus(null);
    if (pw.length < 6) { setStatus("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setStatus("Passwords do not match."); return; }

    setLoading(true);
    try {
      // Re-establish session from URL before updating (needed after signOut above)
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));

      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      if (tokenHash && type === "recovery") {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
      } else {
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }

      const { error: authErr } = await supabase.auth.updateUser({ password: pw });
      if (authErr) throw authErr;

      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (email) {
        await supabase.rpc("set_profile_password_by_email", {
          _email: email,
          _new_password: pw,
        });
      }

      setStatus("✅ Password updated! Redirecting to login...");
      setPw("");
      setPw2("");
      await supabase.auth.signOut();
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (e: any) {
      setStatus(e?.message || "Something went wrong. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="mt-2 text-zinc-600">Enter a new password.</p>

        <div className="mt-8 bg-white border rounded-2xl shadow-sm p-6 space-y-4">

          {linkError ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">Link expired or invalid</p>
              <p className="mt-1">{linkError}</p>
              <a href="/forgot-password" className="mt-2 inline-block font-semibold underline text-red-700">
                Request a new reset link →
              </a>
            </div>
          ) : !sessionReady ? (
            <p className="text-sm text-zinc-500 animate-pulse">Verifying reset link...</p>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-zinc-700">New password *</label>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="New password"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Confirm password *</label>
                <input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="button"
                onClick={save}
                disabled={loading}
                className={`w-full px-4 sm:px-6 py-3 rounded-xl text-white shadow-md ${
                  loading ? "bg-zinc-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving..." : "Save new password"}
              </button>

              {status && (
                <p className={`text-sm ${status.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
                  {status}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}