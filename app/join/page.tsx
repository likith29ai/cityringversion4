"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Group = {
  id: string;
  title: string;
  city: string;
  interest: string;
  description: string;
  platforms: string[];
  poster_url?: string | null; // ✅ IMPORTANT: used to show poster
};

export default function JoinPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [interest, setInterest] = useState("All");
  const [city, setCity] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [search, setSearch] = useState("");

  // Search helpers for the Interest/City dropdowns
  const [interestSearch, setInterestSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Dropdown open state
  const [interestOpen, setInterestOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const interestWrapRef = useRef<HTMLDivElement | null>(null);
  const cityWrapRef = useRef<HTMLDivElement | null>(null);

  // Fetch groups from Supabase
  useEffect(() => {
    async function loadGroups() {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading groups:", error);
      } else {
        setGroups((data as Group[]) || []);
      }
      setLoading(false);
    }

    loadGroups();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;

      if (interestOpen && interestWrapRef.current && !interestWrapRef.current.contains(t)) {
        setInterestOpen(false);
      }
      if (cityOpen && cityWrapRef.current && !cityWrapRef.current.contains(t)) {
        setCityOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [interestOpen, cityOpen]);

  const interests = useMemo(() => {
    const set = new Set(groups.map((g) => g.interest).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [groups]);

  const cities = useMemo(() => {
    const set = new Set(groups.map((g) => g.city).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [groups]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      for (const p of g.platforms || []) set.add(p);
    }
    // order matters for UI
    const preferredOrder = ["instagram", "gmail", "whatsapp", "telegram"];
    const ordered = preferredOrder.filter((p) => set.has(p));
    const rest = Array.from(set).filter((p) => !preferredOrder.includes(p));
    return ["All", ...ordered, ...rest];
  }, [groups]);

  const visibleInterests = useMemo(() => {
    const q = interestSearch.trim().toLowerCase();
    if (!q) return interests;
    return interests.filter((i) => i.toLowerCase().includes(q));
  }, [interests, interestSearch]);

  const visibleCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, citySearch]);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const okInterest = interest === "All" || g.interest === interest;
      const okCity = city === "All" || g.city === city;

      const okPlatform =
        platform === "All" || (Array.isArray(g.platforms) && g.platforms.includes(platform));

      // ✅ Main search works for Title + Description + Interest + City
      const okSearch =
        !search.trim() ||
        (g.title + " " + g.description + " " + g.interest + " " + g.city)
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      return okInterest && okCity && okPlatform && okSearch;
    });
  }, [groups, interest, city, platform, search]);

  return (
    <main className="min-h-screen text-white">
      {/* Premium background (same vibe) */}
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.04))]" />
      </div>
       

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-500/80" />
              Explore rings
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Join Ring</h1>
            <p className="mt-2 text-white/70">Discover curated communities by interest and city.</p>
          </div>

          <a
            href="/register"
            className="px-5 py-3 rounded-2xl border border-white/12 bg-white/5 hover:bg-white/8 transition text-white/90 backdrop-blur"
          >
            Not a member? Register
          </a>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm overflow-visible relative z-10">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Interest dropdown */}
              <div ref={interestWrapRef} className="relative">
                <label className="text-sm font-medium text-white/80">Interest</label>

                <button
                  type="button"
                  onClick={() => {
                    setInterestOpen((v) => !v);
                    setCityOpen(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 hover:bg-black/55 transition flex items-center justify-between outline-none focus:ring-2 focus:ring-white/10"
                >
                  <span className="text-sm">
                    <b className="text-white">{interest}</b>
                    <span className="text-white/45 font-normal">
                      {" "}
                      {interest === "All" ? "(All interests)" : ""}
                    </span>
                  </span>
                  <span className={`text-white/60 transition ${interestOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {interestOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-black/90 backdrop-blur shadow-2xl overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <input
                        value={interestSearch}
                        onChange={(e) => setInterestSearch(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Search interest (eg: Cricket)"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 overflow-auto p-2">
                      {visibleInterests.length === 0 && (
                        <div className="p-3 text-sm text-white/55">No matches</div>
                      )}

                      {visibleInterests.map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setInterest(i);
                            setInterestOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition ${
                            interest === i
                              ? "bg-blue-500/15 text-blue-200 border border-blue-500/20"
                              : "hover:bg-white/5 text-white/80"
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* City dropdown */}
              <div ref={cityWrapRef} className="relative">
                <label className="text-sm font-medium text-white/80">City</label>

                <button
                  type="button"
                  onClick={() => {
                    setCityOpen((v) => !v);
                    setInterestOpen(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 hover:bg-black/55 transition flex items-center justify-between outline-none focus:ring-2 focus:ring-white/10"
                >
                  <span className="text-sm">
                    <b className="text-white">{city}</b>
                    <span className="text-white/45 font-normal">
                      {" "}
                      {city === "All" ? "(All cities)" : ""}
                    </span>
                  </span>
                  <span className={`text-white/60 transition ${cityOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {cityOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-2xl sm:rounded-3xl border border-white/10 bg-black/90 backdrop-blur shadow-2xl overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <input
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Search city (eg: Bengaluru)"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-64 overflow-auto p-2">
                      {visibleCities.length === 0 && (
                        <div className="p-3 text-sm text-white/55">No matches</div>
                      )}

                      {visibleCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCity(c);
                            setCityOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition ${
                            city === c
                              ? "bg-blue-500/15 text-blue-200 border border-blue-500/20"
                              : "hover:bg-white/5 text-white/80"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Platform filter */}
              <div>
                <label className="text-sm font-medium text-white/80">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 bg-black/35 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p} className="bg-black">
                      {p === "All" ? "All platforms" : p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main search */}
              <div>
                <label className="text-sm font-medium text-white/80">
                  Search (Title / Description / Interest / City)
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Search anything..."
                />

                <button
                  onClick={() => {
                    setInterest("All");
                    setCity("All");
                    setPlatform("All");
                    setSearch("");
                    setInterestSearch("");
                    setCitySearch("");
                    setInterestOpen(false);
                    setCityOpen(false);
                  }}
                  className="mt-3 w-full px-4 py-3 rounded-2xl border border-white/12 bg-white/5 hover:bg-white/10 transition text-sm text-white"
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="mt-4 text-sm text-white/55">
              Showing <b className="text-white">{filtered.length}</b> ring(s)
            </div>
          </div>
        </div>

        {/* Groups (Netflix style row) */}
        <div className="mt-8">
          {loading && <div className="text-white/60">Loading groups...</div>}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 text-white/70">
              No groups found. Try changing filters.
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className="group border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer bg-white/5 backdrop-blur hover:border-white/20 transition snap-start shrink-0 shadow-sm"
                  style={{ width: 320 }} // ✅ keep same sizing
                  onClick={() => (window.location.href = `/ring/${g.id}`)}
                >
                  {/* ✅ Poster visible + Instagram size (1:1) */}
                  <div className="aspect-square bg-black/40 relative">
                    {g.poster_url ? (
                      <>
                        <img
                          src={g.poster_url}
                          alt={`${g.title} poster`}
                          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 transition"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/55">
                        No poster
                      </div>
                    )}

                    {/* subtle hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(600px_260px_at_50%_0%,rgba(255,255,255,0.10),transparent_65%)]" />
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{g.title}</h3>

                    <p className="mt-2 text-sm text-white/65 line-clamp-2">
                      {g.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Tag>{g.interest}</Tag>
                      <Tag>{g.city}</Tag>
                      {g.platforms?.map((p) => (
                        <Tag key={p}>{p}</Tag>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/ring/${g.id}`;
                      }}
                      className="mt-5 w-full px-4 py-3 rounded-2xl bg-white text-black hover:bg-white/90 transition font-semibold"
                      type="button"
                    >
                      Open
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-3 py-1 rounded-full border border-white/12 bg-black/30 text-white/75">
      {children}
    </span>
  );
}