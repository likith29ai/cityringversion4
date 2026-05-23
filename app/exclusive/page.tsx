"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaInstagram, FaWhatsapp, FaTelegramPlane, FaEnvelope } from "react-icons/fa";

type ExclusiveGroup = {
  id: string;
  title: string;
  city: string | null;
  interest: string | null;
  description: string | null;
  price: number;
  platforms: string[];
  poster_url?: string | null;
};

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: <FaInstagram className="inline w-4 h-4" />,
    telegram: <FaTelegramPlane className="inline w-4 h-4" />,
    whatsapp: <FaWhatsapp className="inline w-4 h-4" />,
    gmail: <FaEnvelope className="inline w-4 h-4" />,
  };
  return icons[platform] || null;
};

export default function ExclusiveJoinPage() {
  const [groups, setGroups] = useState<ExclusiveGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [interest, setInterest] = useState("All");
  const [city, setCity] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [search, setSearch] = useState("");

  const [interestSearch, setInterestSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [interestOpen, setInterestOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const interestWrapRef = useRef<HTMLDivElement | null>(null);
  const cityWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadGroups() {
      const { data, error } = await supabase
        .from("exclusive_groups")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading exclusive groups:", error);
        setGroups([]);
      } else {
        setGroups(((data as any) || []) as ExclusiveGroup[]);
      }
      setLoading(false);
    }
    loadGroups();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (interestOpen && interestWrapRef.current && !interestWrapRef.current.contains(t)) setInterestOpen(false);
      if (cityOpen && cityWrapRef.current && !cityWrapRef.current.contains(t)) setCityOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [interestOpen, cityOpen]);

  const interests = useMemo(() => {
    const set = new Set(groups.map((g) => g.interest || "").map((s) => s.trim()).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [groups]);

  const cities = useMemo(() => {
    const set = new Set(groups.map((g) => g.city || "").map((s) => s.trim()).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [groups]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) for (const p of g.platforms || []) set.add(String(p));
    const preferredOrder = ["instagram", "gmail", "whatsapp", "telegram"];
    const ordered = preferredOrder.filter((p) => set.has(p));
    const rest = Array.from(set).filter((p) => !preferredOrder.includes(p));
    return ["All", ...ordered, ...rest];
  }, [groups]);

  const visibleInterests = useMemo(() => {
    const q = interestSearch.trim().toLowerCase();
    return q ? interests.filter((i) => i.toLowerCase().includes(q)) : interests;
  }, [interests, interestSearch]);

  const visibleCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    return q ? cities.filter((c) => c.toLowerCase().includes(q)) : cities;
  }, [cities, citySearch]);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const okInterest = interest === "All" || (g.interest || "") === interest;
      const okCity = city === "All" || (g.city || "") === city;
      const okPlatform = platform === "All" || (Array.isArray(g.platforms) && g.platforms.includes(platform));
      const okSearch = !search.trim() ||
        ((g.title || "") + " " + (g.description || "") + " " + (g.interest || "") + " " + (g.city || ""))
          .toLowerCase().includes(search.trim().toLowerCase());
      return okInterest && okCity && okPlatform && okSearch;
    });
  }, [groups, interest, city, platform, search]);

  return (
    <main className="min-h-screen text-white">
      {/* Ultra-premium background — richer than join page */}
      <div className="fixed inset-0 -z-10 bg-[#06060A]">
        <div className="absolute inset-0 bg-[radial-gradient(1400px_700px_at_15%_5%,rgba(212,175,55,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_85%_30%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_90%,rgba(212,175,55,0.04),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,rgba(212,175,55,0.02))]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs text-amber-200/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Exclusive Circles
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              Exclusive Groups
            </h1>
            <p className="mt-2 text-white/60 max-w-2xl">
              Premium circles. Payment handled personally after approval.
            </p>
          </div>

          <a
            href="/register"
            className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/8 backdrop-blur transition text-sm"
          >
            Not a member? Register
          </a>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-2xl sm:rounded-3xl border border-white/8 bg-white/4 backdrop-blur shadow-sm overflow-visible" style={{ position: "relative", zIndex: 10 }}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Interest dropdown */}
              <div ref={interestWrapRef} className="relative" style={{ zIndex: 50 }}>
                <label className="text-sm font-medium text-white/70">Interest</label>
                <button
                  type="button"
                  onClick={() => { setInterestOpen((v) => !v); setCityOpen(false); }}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 flex items-center justify-between text-white/90 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <span className="text-sm">
                    <b className="text-white/95">{interest}</b>
                    <span className="text-white/40 font-normal"> {interest === "All" ? "(All interests)" : ""}</span>
                  </span>
                  <span className={`text-white/50 transition ${interestOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {interestOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/98 shadow-2xl overflow-hidden backdrop-blur">
                    <div className="p-3 border-b border-white/8">
                      <input value={interestSearch} onChange={(e) => setInterestSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-white/30 outline-none text-sm"
                        placeholder="Search interest…" autoFocus />
                    </div>
                    <div className="max-h-60 overflow-auto p-2">
                      {visibleInterests.length === 0 && <div className="p-3 text-sm text-white/40">No matches</div>}
                      {visibleInterests.map((i) => (
                        <button key={i} type="button" onClick={() => { setInterest(i); setInterestOpen(false); }}
                          className={["w-full text-left px-3 py-2 rounded-xl text-sm transition", interest === i ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"].join(" ")}>
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* City dropdown */}
              <div ref={cityWrapRef} className="relative" style={{ zIndex: 40 }}>
                <label className="text-sm font-medium text-white/70">City</label>
                <button
                  type="button"
                  onClick={() => { setCityOpen((v) => !v); setInterestOpen(false); }}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 flex items-center justify-between text-white/90 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <span className="text-sm">
                    <b className="text-white/95">{city}</b>
                    <span className="text-white/40 font-normal"> {city === "All" ? "(All cities)" : ""}</span>
                  </span>
                  <span className={`text-white/50 transition ${cityOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {cityOpen && (
                  <div className="absolute z-40 mt-2 w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/98 shadow-2xl overflow-hidden backdrop-blur">
                    <div className="p-3 border-b border-white/8">
                      <input value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-white/30 outline-none text-sm"
                        placeholder="Search city…" autoFocus />
                    </div>
                    <div className="max-h-60 overflow-auto p-2">
                      {visibleCities.length === 0 && <div className="p-3 text-sm text-white/40">No matches</div>}
                      {visibleCities.map((c) => (
                        <button key={c} type="button" onClick={() => { setCity(c); setCityOpen(false); }}
                          className={["w-full text-left px-3 py-2 rounded-xl text-sm transition", city === c ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"].join(" ")}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Platform */}
              <div>
                <label className="text-sm font-medium text-white/70">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 text-white/90 outline-none focus:ring-2 focus:ring-amber-500/20">
                  {platforms.map((p) => (
                    <option key={p} value={p} className="bg-[#0A0A0F]">
                      {p === "All" ? "All platforms" : p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium text-white/70">Search</label>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Title / interest / city…" />
                <button onClick={() => { setInterest("All"); setCity("All"); setPlatform("All"); setSearch(""); setInterestSearch(""); setCitySearch(""); setInterestOpen(false); setCityOpen(false); }}
                  className="mt-3 w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-white/4 hover:bg-white/7 text-sm text-white/80 transition" type="button">
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-white/50">
              Showing <b className="text-white/80">{filtered.length}</b> exclusive group(s)
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8">
          {loading && (
            <div className="flex gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="shrink-0 rounded-3xl border border-white/8 bg-white/4 animate-pulse overflow-hidden" style={{ width: 320 }}>
                  <div className="aspect-square bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/10 rounded-full w-3/4" />
                    <div className="h-3 bg-white/6 rounded-full w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur p-8 text-white/60 text-center">
              <div className="text-3xl mb-3">✦</div>
              No exclusive groups found. Try changing filters.
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className="group rounded-3xl border border-white/8 bg-white/4 backdrop-blur overflow-hidden cursor-pointer transition-all hover:border-amber-500/20 hover:bg-white/6 snap-start shrink-0 shadow-lg"
                  style={{ width: 320 }}
                  onClick={() => (window.location.href = `/exclusive/${g.id}`)}
                >
                  {/* Poster */}
                  <div className="aspect-square bg-black/50 relative overflow-hidden">
                    {g.poster_url ? (
                      <>
                        <img
                          src={g.poster_url}
                          alt={`${g.title} poster`}
                          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 transition"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl">✦</div>
                    )}

                    {/* Price badge */}
                    <div className="absolute top-3 right-3 rounded-xl bg-black/60 border border-amber-500/30 px-3 py-1.5 backdrop-blur">
                      <span className="text-sm font-bold text-amber-300">₹{Number(g.price) || 0}</span>
                    </div>

                    {/* Exclusive badge */}
                    <div className="absolute top-3 left-3 rounded-full bg-black/60 border border-white/10 px-2.5 py-1 backdrop-blur text-[10px] text-white/70 font-medium tracking-wider uppercase">
                      Exclusive
                    </div>

                    {/* Hover shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(600px_260px_at_50%_0%,rgba(212,175,55,0.08),transparent_65%)]" />
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-white/95">{g.title}</h3>
                    <p className="mt-1.5 text-sm text-white/55 line-clamp-2">{g.description || ""}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.interest && <Tag>{g.interest}</Tag>}
                      {g.city && <Tag>{g.city}</Tag>}
                      {g.platforms?.map((p) => (
                        <Tag key={p} gold>{getPlatformIcon(p)} {p}</Tag>
                      ))}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); window.location.href = `/exclusive/${g.id}`; }}
                      className="mt-4 w-full px-4 py-2.5 rounded-2xl bg-white/8 border border-white/10 text-white/90 hover:bg-amber-500/15 hover:border-amber-500/30 hover:text-white transition font-medium text-sm"
                      type="button"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Tag({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border ${gold ? "border-amber-500/20 bg-amber-500/8 text-amber-300/80" : "border-white/8 bg-black/30 text-white/55"}`}>
      {children}
    </span>
  );
}