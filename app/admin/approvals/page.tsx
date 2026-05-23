"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Profile = {
  id: string;
  name: string;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;
  upi_txn_id: string | null;
  payment_status: string;
  plan_id?: string | null;
  plan_price?: number | null;
  subscription_id?: string | null;
  network_mode?: string | null;
};

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ✅ NEW: show load errors on UI
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadPending() {
    setLoading(true);
    setLoadError(null);

    // FIX #2: Query via subscriptions to catch both new members AND existing members adding a network
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, network_mode, upi_txn_id, plan_id, plan_price, profile:profiles(id, name, email, instagram, whatsapp, telegram, upi_txn_id, payment_status, plan_id, plan_price)")
      .eq("status", "pending_approval")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("loadPending failed:", {
        message: error.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
        raw: error,
      });
      setUsers([]);
      setLoadError(error.message || "Failed to load pending approvals.");
      setLoading(false);
      return;
    }

    // Flatten: merge subscription info into profile shape
    const flattened: Profile[] = (data || []).map((row: any) => ({
      ...row.profile,
      upi_txn_id: row.upi_txn_id || row.profile?.upi_txn_id,
      plan_id: row.plan_id || row.profile?.plan_id,
      plan_price: row.plan_price || row.profile?.plan_price,
      subscription_id: row.id,
      network_mode: row.network_mode,
    }));

    setUsers(flattened);
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function approve(profileId: string) {
    if (processingId) return;
    setProcessingId(profileId);

    try {
      // ✅ 1) Approve profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          payment_status: "verified",
          is_member: true,
        })
        .eq("id", profileId);

      if (profErr) {
        console.error("Approve profile failed:", {
          message: profErr.message,
          details: (profErr as any)?.details,
          hint: (profErr as any)?.hint,
          code: (profErr as any)?.code,
          raw: profErr,
        });
        alert(`Approve failed: ${profErr.message}`);
        return;
      }

      // FIX #3: Only activate THIS specific subscription by ID — not all subscriptions for the profile
      const user = users.find((u) => u.id === profileId);
      const subId = user?.subscription_id;
      if (!subId) {
        alert("Could not find subscription ID. Please refresh and try again.");
        return;
      }
      const { error: subErr } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          groups_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subId);

      if (subErr) {
        console.error("Activate subscription failed:", {
          message: subErr.message,
          details: (subErr as any)?.details,
          hint: (subErr as any)?.hint,
          code: (subErr as any)?.code,
          raw: subErr,
        });
        alert(
          `Approved profile, but subscription activation failed: ${subErr.message}

Make sure payment page is creating subscriptions.`
        );
        return;
      }

      // ✅ remove from list
      setUsers((prev) => prev.filter((u) => u.id !== profileId));
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(profileId: string) {
    if (processingId) return;
    setProcessingId(profileId);

    try {
      // FIX: Only update payment_status — is_member handled below after subscription check
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          payment_status: "rejected",
        })
        .eq("id", profileId);

      if (profErr) {
        console.error("Reject profile failed:", {
          message: profErr.message,
          details: (profErr as any)?.details,
          hint: (profErr as any)?.hint,
          code: (profErr as any)?.code,
          raw: profErr,
        });
        alert(`Reject failed: ${profErr.message}`);
        return;
      }

      // FIX #4a: Only reject THIS specific subscription by its ID
      const userToReject = users.find((u) => u.id === profileId);
      const subIdToReject = userToReject?.subscription_id;
      if (subIdToReject) {
        const { error: subErr } = await supabase
          .from("subscriptions")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subIdToReject);
        if (subErr) {
          console.error("Mark subscription rejected failed (ignored):", {
            message: subErr.message,
            details: (subErr as any)?.details,
            hint: (subErr as any)?.hint,
            code: (subErr as any)?.code,
            raw: subErr,
          });
        }
      }

      // FIX #4b: Only set is_member=false if NO other active subscriptions exist
      const { data: otherActive } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", profileId)
        .eq("status", "active");
      if (!otherActive || otherActive.length === 0) {
        await supabase.from("profiles").update({ is_member: false }).eq("id", profileId);
      }

      // ✅ remove from list
      setUsers((prev) => prev.filter((u) => u.id !== profileId));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main>
      <h1 className="text-4xl font-bold">Membership approvals</h1>
      <p className="mt-2 text-zinc-600">Approve or reject users after payment verification.</p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={loadPending}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* ✅ NEW: show load error */}
      {loadError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading && <p className="mt-6 text-zinc-500">Loading...</p>}

      {!loading && !loadError && users.length === 0 && (
        <p className="mt-6 text-zinc-500">No pending approvals 🎉</p>
      )}

      <div className="mt-8 space-y-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h3 className="text-lg font-semibold">{u.name}</h3>

              <div className="text-sm text-zinc-600 space-y-1 mt-1">
                {u.email && <div>Email: {u.email}</div>}
                {u.instagram && <div>Instagram: {u.instagram}</div>}
                {u.whatsapp && <div>WhatsApp: {u.whatsapp}</div>}
                {u.telegram && <div>Telegram: {u.telegram}</div>}
                {u.upi_txn_id && <div>Txn ID: {u.upi_txn_id}</div>}
                {u.network_mode && <div>Network: <b>{u.network_mode}</b></div>}
                {u.plan_id && <div>Plan: {u.plan_id}</div>}
                {typeof u.plan_price === "number" && <div>Amount: ₹{u.plan_price}</div>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approve(u.id)}
                disabled={processingId === u.id}
                className="px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {processingId === u.id ? "Approving..." : "Approve"}
              </button>

              <button
                onClick={() => reject(u.id)}
                disabled={processingId === u.id}
                className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {processingId === u.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}