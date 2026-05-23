"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FaInstagram, FaWhatsapp, FaTelegramPlane, FaEnvelope } from "react-icons/fa";

type ExclusiveGroup = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  city: string | null;
  interest: string | null;
  platforms: string[];
  poster_url: string | null;
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  gmail: "Gmail (Any network)",
};

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: <FaInstagram className="w-4 h-4" />,
    telegram: <FaTelegramPlane className="w-4 h-4" />,
    whatsapp: <FaWhatsapp className="w-4 h-4" />,
    gmail: <FaEnvelope className="w-4 h-4" />,
  };
  return icons[platform] || null;
};

export default function ExclusiveGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [group, setGroup] = useState<ExclusiveGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("exclusive_groups")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) { console.error(error); setGroup(null); }
      else setGroup((data as any) || null);
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <main className="min-h-screen text-white">
      {/* Ultra-premium exclusive background with enhanced golden gradient */}
      <div className="fixed inset-0 -z-10 bg-[#04040A]">
        <div className="absolute inset-0 bg-[radial-gradient(1600px_800px_at_10%_0%,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_90%_20%,rgba(212,175,55,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(212,175,55,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(212,175,55,0.03))]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <a href="/exclusive" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition">
          ← Back to Exclusive Circles
        </a>

        {loading ? (
          <p className="mt-6 text-sm text-white/50 animate-pulse">Loading...</p>
        ) : !group ? (
          <p className="mt-6 text-sm text-white/50">Exclusive group not found.</p>
        ) : (
          <>
            {/* Header Section */}
            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/12 px-3 py-1.5 text-xs text-amber-200/90 backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Exclusive Circle
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                {group.title}
              </h1>
            </div>

            {/* Poster Section */}
            <div className="mt-12 rounded-3xl overflow-hidden border border-amber-500/15 bg-gradient-to-b from-white/6 to-white/2 backdrop-blur shadow-[0_0_40px_rgba(212,175,55,0.08)] flex justify-center">
              {group.poster_url ? (
                <img
                  src={group.poster_url}
                  alt={group.title}
                  className="max-w-2xl w-full h-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full py-20 flex items-center justify-center text-white/20 text-6xl">✦</div>
              )}
            </div>

            {/* Description */}
            <p className="mt-10 text-white/70 max-w-2xl leading-relaxed text-lg">
              {group.description}
            </p>

            {/* Premium Info Cards Section */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6">
              {group.interest && (
                <div className="rounded-2xl sm:rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-white/2 backdrop-blur p-5 sm:p-6">
                  <p className="text-xs sm:text-sm text-amber-300/70 font-semibold tracking-wide uppercase">Interest</p>
                  <p className="mt-2 text-lg sm:text-xl font-semibold text-white/95">{group.interest}</p>
                </div>
              )}

              {group.city && (
                <div className="rounded-2xl sm:rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-white/2 backdrop-blur p-5 sm:p-6">
                  <p className="text-xs sm:text-sm text-amber-300/70 font-semibold tracking-wide uppercase">City</p>
                  <p className="mt-2 text-lg sm:text-xl font-semibold text-white/95">{group.city}</p>
                </div>
              )}
            </div>

            {/* About This Exclusive Box */}
            <div className="mt-12 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 via-white/3 to-amber-500/5 backdrop-blur p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <div className="flex-1">
                 <h2 className="text-xl sm:text-2xl font-bold text-white">About This Exclusive Circle</h2>
<p className="mt-3 text-white/60 leading-relaxed text-base">
   
</p>
<ul className="mt-4 space-y-3">
  {[
    "Entry is granted through a short application and review process to maintain the quality and intent of the community.",
    "Skip full price. Members get discounted entry to city events before they open to anyone else.",
    "Got an idea for an event? We promote it. You run it.",
    "Invites to events that never go public — only members ever know they happened.",
    "Every member is vetted. So the people you meet here are actually worth meeting.",
    "This circle stays small on purpose. Apply to be considered.",
  ].map((point) => (
    <li key={point} className="flex items-start gap-3 text-white/60 text-base">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
      <span>{point}</span>
    </li>
  ))}
</ul>
                </div>
              </div>
            </div>

            {/* Networks Section */}
            {group.platforms && group.platforms.length > 0 && (
              <div className="mt-12 rounded-3xl border border-white/10 bg-white/3 backdrop-blur p-7 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-white">Available Networks</h3>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.platforms.map((p) => (
                    <div
                      key={p}
                      className="rounded-2xl border border-white/8 bg-black/30 p-4 flex items-center gap-3 hover:border-white/15 transition"
                    >
                      <div className="text-amber-300">
                        {getPlatformIcon(p)}
                      </div>
                      <span className="text-white/85 font-semibold">{PLATFORM_LABELS[p] || p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section - Premium */}
            <div className="mt-12 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-white/4 to-amber-500/8 backdrop-blur overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <div className="px-6 sm:px-8 py-6 sm:py-8 bg-black/40 border-b border-amber-500/20">
                <div className="text-sm font-bold tracking-widest uppercase text-amber-300">Ready to Join?</div>
                <p className="mt-2 text-white/70 text-base">Submit your application to be reviewed by our admin. Approval required for membership.</p>
              </div>

              <div className="px-6 sm:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                  {/* Price Display */}
                  <div>
                    <p className="text-sm text-amber-300/70 font-semibold tracking-wider uppercase">Entry Price</p>
                    <p className="mt-3 text-4xl sm:text-5xl font-bold text-white">
                      ₹<span className="text-amber-300">{group.price}</span>
                    </p>
                    <p className="mt-2 text-sm text-white/50">Payment after approval</p>
                  </div>

                  {/* Apply Button */}
                  <a
                    href={`/exclusive/${group.id}/apply`}
                    className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-white to-amber-50 text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition hover:from-amber-50 hover:to-white"
                  >
                    Apply Now →
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}