"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Intro from "./components/Intro";

type Group = {
  id: string;
  title: string;
  city: string;
  interest: string;
  description: string;
  poster_url?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  created_at?: string;
};

type Section = {
  id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  groups: Group[];
};

export default function Home() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load sections — no is_active filter, admin controls visibility by deleting
      const { data: secData, error: secErr } = await supabase
        .from("homepage_sections")
        .select("id,title,subtitle,sort_order")
        .order("sort_order", { ascending: true });

      if (secErr) {
        console.error("Sections load error:", secErr);
        setLoading(false);
        return;
      }

      // Load section items — separate query to avoid join failures
      const { data: itemData, error: itemErr } = await supabase
        .from("homepage_section_items")
        .select("section_id, sort_order, group_id");

      if (itemErr) {
        console.error("Items load error:", itemErr);
        setLoading(false);
        return;
      }

      // Load all groups referenced by items
      const groupIds = [...new Set((itemData ?? []).map((i: any) => i.group_id))];
      let groupMap: Record<string, Group> = {};

      if (groupIds.length > 0) {
        const { data: groupData } = await supabase
          .from("groups")
          .select("id,title,city,interest,description,poster_url,is_active")
          .in("id", groupIds);

        for (const g of groupData ?? []) {
          groupMap[(g as any).id] = g as Group;
        }
      }

      // Build sections with their groups in sort order
      const built: Section[] = (secData ?? []).map((s: any) => {
        const items = (itemData ?? [])
          .filter((i: any) => i.section_id === s.id)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((i: any) => groupMap[i.group_id])
          .filter(Boolean) as Group[];
        return { id: s.id, title: s.title, subtitle: s.subtitle, sort_order: s.sort_order, groups: items };
      });

      setSections(built);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* VIDEO INTRO */}
      <Intro />

      {/* BANNER */}
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full h-[80px] sm:h-[120px] md:h-[180px] lg:h-[280px]">
          <img
            src="/banner.png"
            alt="CityRing banner"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-black" />
        </div>
      </section>

      {/* HERO - 3 BOXES (Join, Register, Exclusive) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 lg:gap-10">
          {/* JOIN BOX */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:p-9 overflow-hidden">
            <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Join</div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                Find your circle.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-white/70 leading-relaxed">
                Discover rings by <span className="text-white">city</span> and{" "}
                <span className="text-white">interest</span>. Step into communities that match you.
              </p>

              <div className="mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4">
                <a
                  href="/join"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 transition px-6 sm:px-8 py-2 sm:py-3 font-medium text-sm sm:text-base shadow-[0_0_34px_rgba(37,99,235,0.45)]"
                >
                  Join
                </a>
                <span className="text-xs text-white/45">Takes 10 seconds • No spam</span>
              </div>
            </div>
          </div>

          {/* REGISTER BOX */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:p-9 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="relative">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Register</div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                Become a verified member.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-white/70 leading-relaxed">
                Create your profile, choose your network, and unlock private rings.
              </p>

              <div className="mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition px-6 sm:px-8 py-2 sm:py-3 font-medium text-sm sm:text-base"
                >
                  Register
                </a>
                <span className="text-xs text-white/45">Admin-approved • Private</span>
              </div>
            </div>
          </div>

          {/* EXCLUSIVE BOX */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:p-9 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-600/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Exclusive</div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                Join exclusive groups.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-white/70 leading-relaxed">
                Access exclusive groups available to members only.
              </p>

              <div className="mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4">
                <a
                  href="/exclusive"
                  className="inline-flex items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-600/10 hover:bg-amber-600/20 transition px-6 sm:px-8 py-2 sm:py-3 font-medium text-sm sm:text-base text-amber-100"
                >
                  Explore
                </a>
                <span className="text-xs text-white/45">Premium • Curated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOMEPAGE SECTIONS — driven by admin */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 space-y-12">
        {loading && (
          <Row title="" subtitle="" items={[]} loading={true} />
        )}
        {!loading && sections.length === 0 && (
          <div className="text-center text-white/40 text-sm py-12">No sections yet.</div>
        )}
        {!loading && sections.map((s) => (
          <Row key={s.id} title={s.title} subtitle={s.subtitle ?? ""} items={s.groups} loading={false} />
        ))}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-xs sm:text-sm text-white/50">
          © {new Date().getFullYear()} CityRing. Built for real communities.
        </div>
      </footer>
    </main>
  );
}


function Row({
  title,
  subtitle,
  items,
  loading,
}: {
  title: string;
  subtitle: string;
  items: Group[];
  loading: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 sm:gap-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs sm:text-sm text-white/60">{subtitle}</p>
        </div>
      </div>

      {/* Horizontal row (scrollable, scrollbar hidden) */}
      <div className="relative mt-5">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black to-transparent z-10" />

        <div
          ref={scrollerRef}
          className="overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex gap-3 pb-3 min-w-max pr-6">
            {loading && (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[160px] sm:w-[180px] h-[130px] sm:h-[140px] rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                  />
                ))}
              </>
            )}

            {!loading && items.length === 0 && <div className="text-white/60 text-xs sm:text-sm">No rings yet.</div>}

            {!loading &&
              items.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => (window.location.href = `/ring/${g.id}`)}
                  className="group w-[160px] sm:w-[180px] text-left"
                >
                  <div className="relative rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
                    {/* POSTER - FILLS ENTIRE BOX (NO BLACK SPACE) */}
                    <div className="h-[100px] sm:h-[105px] bg-black/40 relative overflow-hidden">
                      <img
                        src={g.poster_url || g.image_url || "/poster-fallback.png"}
                        alt={g.title}
                        className="w-full h-full object-cover opacity-90 transition duration-300 group-hover:opacity-100"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/poster-fallback.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    </div>

                    {/* Text */}
                    <div className="p-2 sm:p-3">
                      <div className="font-semibold truncate text-xs sm:text-sm">{g.title}</div>
                      <div className="mt-1 text-[10px] sm:text-[11px] text-white/60 truncate">
                        {g.interest} • {g.city}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}