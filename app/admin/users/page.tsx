"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id?: string; // subscription ID if available
  profile_id: string;
  name: string;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;

  payment_status: string;
  is_member: boolean;
  upi_txn_id: string | null;

  plan_id: string | null;
  network_mode: string | null;
  group_limit: number | null;
  groups_used: number | null;
  subscription_status: "pending_approval" | "active" | "expired" | "rejected" | null;
  updated_at: string | null;
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);

  const [saving, setSaving] = useState(false);

  // editable fields
  const [editLimit, setEditLimit] = useState<string>("");
  const [editUsed, setEditUsed] = useState<string>("");
  const [editStatus, setEditStatus] = useState<Row["subscription_status"]>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("v_memberships")
      .select("*")
      .order("updated_at", { ascending: false });

    if (loadError) {
      const errorMsg = `Failed to load users: ${loadError.message}`;
      console.error("❌ Load error:", loadError);
      setError(errorMsg);
      setRows([]);
    } else {
      setRows((data as any) || []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const groupedByProfile = useMemo(() => {
    const grouped = new Map<string, Row[]>();
    
    for (const row of rows) {
      if (!grouped.has(row.profile_id)) {
        grouped.set(row.profile_id, []);
      }
      grouped.get(row.profile_id)!.push(row);
    }
    
    return grouped;
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const result: { profile: Row; subscriptions: Row[] }[] = [];
    
    for (const [profileId, subscriptions] of groupedByProfile) {
      const firstRow = subscriptions[0];
      
      const matches =
        (firstRow.name || "").toLowerCase().includes(term) ||
        (firstRow.email || "").toLowerCase().includes(term) ||
        (firstRow.instagram || "").toLowerCase().includes(term) ||
        (firstRow.whatsapp || "").toLowerCase().includes(term) ||
        (firstRow.telegram || "").toLowerCase().includes(term) ||
        profileId.toLowerCase().includes(term);
      
      if (!term || matches) {
        result.push({
          profile: firstRow,
          subscriptions: subscriptions,
        });
      }
    }
    
    return result;
  }, [groupedByProfile, q]);

  function openRow(r: Row) {
    setSelected(r);
    setEditLimit(String(r.group_limit ?? ""));
    setEditUsed(String(r.groups_used ?? 0));
    setEditStatus(r.subscription_status ?? null);
  }

  function groupsLeftPreview(limit: number | null, used: number | null) {
    const l = Number(limit ?? 0);
    const u = Number(used ?? 0);
    return Math.max(l - u, 0);
  }

  async function save() {
    if (!selected) return;
    if (saving) return;

    const group_limit = Number(editLimit);
    const groups_used = Number(editUsed);

    if (!Number.isFinite(group_limit) || group_limit <= 0) {
      alert("group_limit must be a number > 0");
      return;
    }
    if (!Number.isFinite(groups_used) || groups_used < 0) {
      alert("groups_used must be a number >= 0");
      return;
    }

    let nextStatus: Row["subscription_status"] = editStatus;
    if (groups_used >= group_limit) nextStatus = "expired";
    if (!nextStatus) nextStatus = "active";

    setSaving(true);

    try {
      // ✅ FIXED: Handle multiple subscriptions gracefully
      // Instead of .maybeSingle() which fails with multiple rows,
      // we get all matching subscriptions and use the latest
      const { data: allRows, error: checkErr } = await supabase
        .from("subscriptions")
        .select("id, created_at")
        .eq("profile_id", selected.profile_id)
        .eq("network_mode", selected.network_mode)
        .order("created_at", { ascending: false });

      if (checkErr) {
        const errorMsg = checkErr?.message || "Unknown error occurred";
        console.error("❌ Subscription check error:", checkErr);
        alert(`Error checking subscription: ${errorMsg}`);
        setSaving(false);
        return;
      }

      // Get the latest subscription ID if any exist
      const existingId = allRows?.[0]?.id || null;

      // Warn if multiple subscriptions found
      if (allRows && allRows.length > 1) {
        console.warn(
          `⚠️ Found ${allRows.length} subscriptions for profile ${selected.profile_id} with plan ${selected.plan_id}. Using the latest. Consider cleaning up duplicates in the database.`
        );
      }

      // Decide whether to insert or update
      if (!existingId) {
        // No subscription exists, create new one
        const { error: insErr } = await supabase.from("subscriptions").insert({
          profile_id: selected.profile_id,
          plan_id: selected.plan_id ?? "manual",
          group_limit,
          groups_used,
          status: nextStatus,
        });

        if (insErr) {
          const errorMsg = insErr?.message || "Unknown error occurred";
          console.error("❌ Subscription create error:", insErr);
          alert(`Failed to create subscription: ${errorMsg}`);
          setSaving(false);
          return;
        }
      } else {
        // Subscription exists, update it
        const { error: updErr } = await supabase
          .from("subscriptions")
          .update({
            group_limit,
            groups_used,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId);

        if (updErr) {
          const errorMsg = updErr?.message || "Unknown error occurred";
          console.error("❌ Subscription update error:", updErr);
          alert(`Failed to update subscription: ${errorMsg}`);
          setSaving(false);
          return;
        }
      }

      // Update profile flags to keep consistency
      if (nextStatus === "active") {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ is_member: true, payment_status: "verified" })
          .eq("id", selected.profile_id);
        
        if (profileErr) {
          console.error("⚠️ Warning: Failed to update profile to active:", profileErr);
        }
      }
      
      if (nextStatus === "expired") {
        // Only set is_member = false if ALL other subscriptions are also expired/rejected
        const { data: otherSubs } = await supabase
          .from("subscriptions")
          .select("id, status")
          .eq("profile_id", selected.profile_id)
          .neq("id", existingId ?? "");

        const hasOtherActive = (otherSubs || []).some(
          (s: any) => s.status === "active" || s.status === "pending_approval"
        );

        if (!hasOtherActive) {
          const { error: profileErr } = await supabase
            .from("profiles")
            .update({ is_member: false })
            .eq("id", selected.profile_id);

          if (profileErr) {
            console.error("⚠️ Warning: Failed to update profile to expired:", profileErr);
          }
        }
      }

      alert("✅ Updated successfully");
      setSelected(null);
      await load();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("❌ Unexpected error during save:", err);
      alert(`Unexpected error: ${errorMsg}`);
      setSaving(false);
    }
  }

  function networkBadge(mode: string | null) {
    switch (mode) {
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200">
            📸 Instagram
          </span>
        );
      case "whatsapp":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            📱 WhatsApp
          </span>
        );
      case "telegram":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            ✈️ Telegram
          </span>
        );
      case "all":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
            🌐 All Networks
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
            — Unknown
          </span>
        );
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold">Admin — Manage Users</h1>
        <p className="mt-2 text-zinc-600">Search users and manually edit group limits/usage.</p>

        {/* Error banner */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-[420px] rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search by name, email, insta, whatsapp, telegram..."
          />
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-3 rounded-xl border bg-white hover:bg-zinc-50 disabled:opacity-50 text-sm"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading && <p className="mt-6 text-zinc-500">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <p className="mt-6 text-zinc-500">No users found.</p>
        )}

        {!loading && filtered.length > 0 && (
          <p className="mt-6 text-sm text-zinc-600">
            Showing {filtered.length} users with {rows.length} total subscriptions
          </p>
        )}

        <div className="mt-6 space-y-6">
          {filtered.slice(0, 30).map((item) => (
            <div
              key={item.profile.profile_id}
              className="bg-white border rounded-2xl p-5 shadow-sm"
            >
              {/* User Header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <div className="text-lg font-semibold">{item.profile.name}</div>
                  <div className="text-sm text-zinc-600">
                    {item.profile.email || item.profile.instagram || item.profile.whatsapp || item.profile.telegram || item.profile.profile_id}
                  </div>
                </div>
              </div>

              {/* Subscriptions for this user */}
              <div className="mt-4 space-y-3">
                {item.subscriptions.map((sub, idx) => (
                  <button
                    key={`${sub.profile_id}-${sub.plan_id}-${idx}`}
                    onClick={() => openRow(sub)}
                    className="w-full text-left bg-zinc-50 border rounded-xl p-4 hover:bg-zinc-100 transition"
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-sm">
                            Plan: <span className="text-blue-600">{sub.plan_id ?? "-"}</span>
                          </div>
                          {networkBadge(sub.network_mode)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-1">
                          Status: <span className="font-medium">{sub.subscription_status ?? "-"}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          Groups: {sub.groups_used} / {sub.group_limit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-600">Groups left</div>
                        <div className="text-lg font-bold">
                          {groupsLeftPreview(sub.group_limit, sub.groups_used)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Editor Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-xl bg-white rounded-2xl border shadow-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-zinc-600">
                    {selected.email || selected.instagram || selected.whatsapp || selected.telegram || selected.profile_id}
                  </p>
                  <p className="mt-2 text-sm font-medium text-blue-600">
                    Plan: {selected.plan_id}
                  </p>
                  <div className="mt-1">{networkBadge(selected.network_mode)}</div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Profile ID: {selected.profile_id}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  disabled={saving}
                  className="px-3 py-1 rounded-lg border bg-white hover:bg-zinc-50 disabled:opacity-50 text-sm"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Group limit</label>
                  <input
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    placeholder="eg: 30"
                    type="number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">Groups used</label>
                  <input
                    value={editUsed}
                    onChange={(e) => setEditUsed(e.target.value)}
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    placeholder="eg: 12"
                    type="number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">Status</label>
                  <select
                    value={editStatus ?? ""}
                    onChange={(e) => setEditStatus((e.target.value as any) || null)}
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    <option value="">(auto)</option>
                    <option value="pending_approval">pending_approval</option>
                    <option value="active">active</option>
                    <option value="expired">expired</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-700">
                Groups left (preview):{" "}
                <b>{groupsLeftPreview(Number(editLimit || 0), Number(editUsed || 0))}</b>
                {Number(editUsed) >= Number(editLimit) && (
                  <span className="ml-2 text-orange-700">(Will auto-expire)</span>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl border bg-white hover:bg-zinc-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Tip: If groups_used ≥ group_limit, status will automatically become <b>expired</b>.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}