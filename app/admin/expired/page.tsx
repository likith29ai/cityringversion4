"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Row = {
  id: string;  // ✅ FIXED: Added subscription ID
  profile_id: string;
  name: string;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;
  plan_id: string | null;
  group_limit: number | null;
  groups_used: number | null;
  subscription_status: "expired" | string | null;
  updated_at: string | null;
};

export default function AdminExpiredPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("v_memberships")
      .select("*")
      .eq("subscription_status", "expired")
      .order("updated_at", { ascending: false });

    if (error) console.error(error);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ✅ FIXED: Now accepts subscriptionId and updates only that subscription
  async function approveAgain(profileId: string, subscriptionId: string) {
    if (processing) return;
    setProcessing(subscriptionId);

    try {
      // Mark ONLY THIS subscription active + reset used
      const { error: subErr } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          groups_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);  // ✅ CRITICAL FIX: Use subscription ID, not profile_id!

      if (subErr) {
        console.error(subErr);
        alert(`Failed: ${subErr.message}`);
        setProcessing(null);
        return;
      }

      // Check if user has other active subscriptions
      const { data: otherActive } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", profileId)
        .eq("status", "active");

      // Update profile only if user has at least one active subscription
      if (otherActive && otherActive.length > 0) {
        await supabase
          .from("profiles")
          .update({ is_member: true, payment_status: "verified" })
          .eq("id", profileId);
      }

      setRows((prev) => prev.filter((r) => r.id !== subscriptionId));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold">Admin — Expired Members</h1>
        <p className="mt-2 text-zinc-600">
          Users who reached their group-join limit. You can approve again after verifying renewal.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="mt-6 text-zinc-500">Loading...</p>}
        {!loading && rows.length === 0 && (
          <p className="mt-6 text-zinc-500">No expired members 🎉</p>
        )}

        <div className="mt-8 space-y-4">
          {rows.map((r) => {
            const left = Math.max(Number(r.group_limit ?? 0) - Number(r.groups_used ?? 0), 0);
            const idLine = r.email || r.instagram || r.whatsapp || r.telegram || r.profile_id;

            return (
              <div
                key={r.id}  // ✅ FIXED: Use subscription ID as key
                className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="text-lg font-semibold">{r.name}</div>
                  <div className="text-sm text-zinc-600">{idLine}</div>

                  <div className="mt-2 text-xs text-zinc-500">
                    Plan: <b>{r.plan_id ?? "-"}</b> • Limit: <b>{r.group_limit ?? "-"}</b> • Used:{" "}
                    <b>{r.groups_used ?? "-"}</b> • Left: <b>{left}</b>
                  </div>
                </div>

                <button
                  onClick={() => approveAgain(r.profile_id, r.id)}  // ✅ FIXED: Pass subscriptionId
                  disabled={processing === r.id}  // ✅ FIXED: Check against subscription ID
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {processing === r.id ? "Approving..." : "Approve Again"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Note: This button should be used only after you verify renewal payment manually.
        </p>
      </div>
    </main>
  );
}