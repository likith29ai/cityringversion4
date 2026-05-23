"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profile_id: string;
  exclusive_group_id: string;
  profiles?: {
    name: string | null;
    email: string | null;
    instagram: string | null;
    whatsapp: string | null;
    telegram: string | null;
  } | null;
  exclusive_groups?: {
    title: string;
    price: number;
  } | null;
};

export default function AdminExclusiveApplicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Row["status"]>("all");

  useEffect(() => {
    async function load() {
      // NOTE: This requires foreign keys + RLS policies.
      const { data, error } = await supabase
        .from("exclusive_applications")
        .select(
          "id, status, created_at, profile_id, exclusive_group_id, profiles(name,email,instagram,whatsapp,telegram), exclusive_groups(title,price)"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows(((data as any) || []) as Row[]);
      }
      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function setStatus(id: string, status: Row["status"]) {
    const { error } = await supabase.from("exclusive_applications").update({ status }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-4xl font-bold">Exclusive Applications</h1>
            <p className="mt-2 text-zinc-600">
              Review applications. Payment is handled personally after approval.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-xl border px-4 py-3 bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <a href="/admin/exclusive" className="px-5 py-3 rounded-xl border hover:bg-white">
              ← Back
            </a>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-zinc-600">No applications.</div>
          ) : (
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-0 text-xs font-semibold text-zinc-600 bg-zinc-50 border-b p-4">
                <div className="col-span-3">Group</div>
                <div className="col-span-3">Applicant</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>

              {filtered.map((r) => {
                const p = r.profiles;
                const g = r.exclusive_groups;
                const contact = p?.instagram || p?.whatsapp || p?.telegram || p?.email || "—";

                return (
                  <div key={r.id} className="grid grid-cols-12 gap-0 p-4 border-b last:border-b-0">
                    <div className="col-span-3">
                      <div className="font-semibold">{g?.title || r.exclusive_group_id}</div>
                      <div className="text-xs text-zinc-500">₹{g?.price ?? "—"}</div>
                    </div>

                    <div className="col-span-3">
                      <div className="font-medium">{p?.name || "—"}</div>
                      <div className="text-xs text-zinc-500">{p?.email || "—"}</div>
                    </div>

                    <div className="col-span-2 text-sm">{contact}</div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs border ${
                          r.status === "approved"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : r.status === "rejected"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-yellow-50 border-yellow-200 text-yellow-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => setStatus(r.id, "approved")}
                        className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs"
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setStatus(r.id, "rejected")}
                        className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs"
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
