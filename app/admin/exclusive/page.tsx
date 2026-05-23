"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ExclusiveGroup = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city?: string | null;
  interest?: string | null;
  platforms: string[];
};

export default function AdminExclusiveGroupsPage() {
  const [groups, setGroups] = useState<ExclusiveGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("exclusive_groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setGroups([]);
      } else {
        setGroups(((data as any) || []) as ExclusiveGroup[]);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold">Exclusive Groups</h1>
            <p className="mt-2 text-zinc-600">Create and manage premium groups + applications.</p>
          </div>
          {/* NAVBAR */}
      <nav className="border-y border-white/10 bg-black/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-[50px] sm:h-[60px] flex items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 lg:gap-x-10 gap-y-1 text-xs sm:text-sm lg:text-[15px] tracking-wide text-white/80">
              <a className="hover:text-white transition" href="/">Home</a>
              <a className="hover:text-white transition" href="/join">Join</a>
              <a className="hover:text-white transition" href="/register">Register</a>
              <a className="hover:text-white transition" href="/exclusive">Exclusive</a>
              <a className="hover:text-white transition" href="/about">About</a>
              <a className="hover:text-white transition" href="/contact">Contact Us</a>
              <a className="hover:text-white transition" href="/complaint">Raise Complaint</a>
            </div>
          </div>
        </div>
      </nav>

          <div className="flex gap-3">
            <a
              href="/admin/exclusive/new"
              className="px-5 py-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              + New Exclusive Group
            </a>
            <a
              href="/admin/exclusive/applications"
              className="px-5 py-3 rounded-xl border hover:bg-white"
            >
              Applications
            </a>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-zinc-600">Loading...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-zinc-600">No exclusive groups available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`/exclusive/${g.id}`}
                  className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-xl font-semibold">{g.title}</div>
                      {g.description && (
                        <div className="mt-1 text-sm text-zinc-600 line-clamp-2">{g.description}</div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-blue-700">₹{g.price}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.interest && <Tag>{g.interest}</Tag>}
                    {g.city && <Tag>{g.city}</Tag>}
                    {(g.platforms || []).map((p) => (
                      <Tag key={p}>{p}</Tag>
                    ))}
                  </div>

                  <div className="mt-4 text-sm text-blue-700">Open →</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-3 py-1 rounded-full border bg-zinc-50">{children}</span>;
}
