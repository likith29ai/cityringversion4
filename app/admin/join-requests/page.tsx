"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type JoinRequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  network_mode: string | null;

  profile: {
    id: string;
    name: string;
    email: string | null;
    instagram: string | null;
    whatsapp: string | null;
    telegram: string | null;
  } | null;

  group: {
    id: string;
    title: string;
    city: string;
  } | null;
};

export default function AdminJoinRequestsPage() {
  const [rows, setRows] = useState<JoinRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    // NOTE: Requires foreign key relations in Supabase:
    // join_requests.profile_id -> profiles.id
    // join_requests.group_id -> groups.id
    const { data, error } = await supabase
      .from("join_requests")
      .select(
        `
        id,
        status,
        created_at,
        network_mode,
        profile:profiles ( id, name, email, instagram, whatsapp, telegram ),
        group:groups ( id, title, city )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    if (processingId) return;
    setProcessingId(id);

    const { error } = await supabase.from("join_requests").update({ status }).eq("id", id);

    if (!error) {
      // FIX #6: If rejected, refund the group slot back to the subscription
      if (status === "rejected") {
        const row = rows.find((r) => r.id === id);
        if (row?.profile?.id && row?.network_mode) {
          await supabase.rpc("decrement_groups_used", {
            _profile_id: row.profile.id,
            _network_mode: row.network_mode,
          });
        }
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      console.error(error);
    }

    setProcessingId(null);
  }

  return (
    <main>
      <h1 className="text-4xl font-bold">Group join requests</h1>
      <p className="mt-2 text-zinc-600">Approve or reject ring join requests.</p>

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
        <p className="mt-6 text-zinc-500">No pending join requests 🎉</p>
      )}

      <div className="mt-8 space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-500">
                  Requested: {new Date(r.created_at).toLocaleString()}
                </div>

                <div className="mt-2">
                  <div className="text-lg font-semibold">
                    {r.profile?.name ?? "Unknown user"}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      {r.profile?.email ? `(${r.profile.email})` : ""}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-zinc-600 space-y-1">
                    {r.group && (
                      <div>
                        Group: <span className="font-medium">{r.group.title}</span> — {r.group.city}
                      </div>
                    )}
                    {r.network_mode && (
                      <div className="font-semibold text-blue-700">
                        Joining via: {r.network_mode === "all" ? "All Networks" : r.network_mode.charAt(0).toUpperCase() + r.network_mode.slice(1)}
                      </div>
                    )}
                    {r.profile?.instagram && <div>Instagram: {r.profile.instagram}</div>}
                    {r.profile?.whatsapp && <div>WhatsApp: {r.profile.whatsapp}</div>}
                    {r.profile?.telegram && <div>Telegram: {r.profile.telegram}</div>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(r.id, "approved")}
                  disabled={processingId === r.id}
                  className="px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {processingId === r.id ? "Approving..." : "Approve"}
                </button>

                <button
                  onClick={() => updateStatus(r.id, "rejected")}
                  disabled={processingId === r.id}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {processingId === r.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}