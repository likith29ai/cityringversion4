"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ExclusiveGroup = {
  id: string;
  title: string;
  price: number;
  platforms: string[];
};

type Profile = {
  id: string;
  name: string;
};

type Subscription = {
  id: string;
  network_mode: string;
  status: string;
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  telegram: "✈️",
  whatsapp: "💬",
  gmail: "📧",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  gmail: "Gmail",
};

// "gmail" platform in exclusive group = any active member can apply
const OPEN_PLATFORM = "gmail";

export default function ExclusiveApplyPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id;

  const [group, setGroup] = useState<ExclusiveGroup | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Which network the user picks to apply with
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { type: "success" | "error" | "warning"; message: string }>(null);

  useEffect(() => {
    if (!groupId) return;

    async function load() {
      setLoading(true);

      // Load group
      const { data: groupData } = await supabase
        .from("exclusive_groups")
        .select("id, title, price, platforms")
        .eq("id", groupId)
        .maybeSingle();

      if (groupData) setGroup((groupData as any) as ExclusiveGroup);

      // Load profile — prefer Supabase session, fall back to localStorage
      let profileId: string | null = null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data: profileByEmail } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("email", session.user.email)
          .maybeSingle();
        if (profileByEmail) {
          setProfile((profileByEmail as any) as Profile);
          profileId = (profileByEmail as any).id;
          // Keep localStorage in sync
          localStorage.setItem("cityring_profile_id", profileId!);
        }
      }

      // Fallback to localStorage if session didn't work
      if (!profileId) {
        profileId = localStorage.getItem("cityring_profile_id");
        if (profileId) {
          const { data: profileById } = await supabase
            .from("profiles")
            .select("id, name")
            .eq("id", profileId)
            .maybeSingle();
          if (profileById) setProfile((profileById as any) as Profile);
        }
      }

      // Load user's active subscriptions
      if (profileId) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id, network_mode, status")
          .eq("profile_id", profileId)
          .eq("status", "active");

        setActiveSubs(((subs as any) || []) as Subscription[]);
      }

      setLoading(false);
    }

    load();
  }, [groupId]);

  // Compute which networks the user CAN apply with for this group
  const eligibleNetworks: string[] = (() => {
    if (!group || activeSubs.length === 0) return [];

    const groupPlatforms = group.platforms || [];

    // If group has "gmail" platform → any active membership qualifies
    if (groupPlatforms.includes(OPEN_PLATFORM)) {
      return activeSubs.map((s) => s.network_mode);
    }

    // Otherwise → only subscriptions matching the group's platforms
    return activeSubs
      .filter((s) => groupPlatforms.includes(s.network_mode))
      .map((s) => s.network_mode);
  })();

  const isEligible = eligibleNetworks.length > 0;

  // Auto-select if only one option
  useEffect(() => {
    if (eligibleNetworks.length === 1 && !selectedNetwork) {
      setSelectedNetwork(eligibleNetworks[0]);
    }
  }, [eligibleNetworks.join(",")]);

  async function submit() {
    if (!groupId || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const profileId = profile?.id || localStorage.getItem("cityring_profile_id");

      if (!profileId || !profile) {
        setResult({ type: "warning", message: "You need to be logged in to apply. Please login first." });
        setSubmitting(false);
        return;
      }

      if (!isEligible) {
        setResult({ type: "warning", message: "You do not have an active membership on the required network(s) for this group." });
        setSubmitting(false);
        return;
      }

      if (!selectedNetwork) {
        setResult({ type: "warning", message: "Please select which network you want to apply with." });
        setSubmitting(false);
        return;
      }

      const { error: appErr } = await supabase.from("exclusive_applications").insert({
        profile_id: profileId,
        exclusive_group_id: groupId,
        status: "pending",
        network_mode: selectedNetwork,
      });

      if (appErr) {
        if ((appErr as any).code === "23505") {
          setResult({ type: "success", message: "✅ Already applied. Please wait for admin response." });
        } else {
          throw appErr;
        }
        setSubmitting(false);
        return;
      }

      setResult({ type: "success", message: "✅ Application sent successfully! Admin will reach out via your selected network." });
      setSubmitting(false);
    } catch (e: any) {
      console.error("Exclusive apply error:", e);
      setResult({ type: "error", message: e?.message || "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  }

  const RULES = [
    ["1. Respect the Circle", "Every ring is built on mutual respect. Members must interact with courtesy, professionalism, and consideration at all times. Harassment, intimidation, or disrespectful behavior will not be tolerated."],
    ["2. Use CityRing for Genuine Connection Only", "CityRing exists to foster meaningful, interest-based connections. It must not be used for spamming, unsolicited promotions, mass messaging, or unrelated commercial activities without authorization."],
    ["3. No Misrepresentation", "Members must provide truthful and accurate information. Creating fake identities, impersonating others, or misrepresenting affiliation, profession, or intent is strictly prohibited."],
    ["4. Protect Privacy and Confidentiality", "Information shared within a ring is expected to remain within that circle. Members must not share, publish, or distribute private conversations, member details, or group content outside the platform without permission."],
    ["5. No Abuse, Hate, or Harmful Content", "CityRing maintains zero tolerance for hate speech, discrimination, threats, explicit content, or any form of harmful or illegal activity."],
    ["6. No Unauthorized Commercial Solicitation", "Members may not use CityRing primarily to sell products, promote services, or recruit for unrelated ventures without prior approval from CityRing."],
    ["7. One Person, One Membership", "Each membership is intended for a single individual. Sharing accounts, transferring memberships, or allowing others to operate under your identity is not permitted."],
    ["8. Follow Platform and Community Guidelines", "Members must follow any specific guidelines established for individual rings, as well as all general platform policies."],
    ["9. Compliance with Applicable Laws", "All members are responsible for ensuring their conduct complies with applicable local, national, and international laws."],
    ["10. Enforcement and Right to Remove Access", "CityRing reserves the right to suspend or permanently revoke membership, remove access to rings, or take appropriate action if any member violates these rules or acts against the spirit of the platform."],
  ];

  return (
    <main className="min-h-screen text-white">
      {/* Ultra-premium background */}
      <div className="fixed inset-0 -z-10 bg-[#06060A]">
        <div className="absolute inset-0 bg-[radial-gradient(1400px_700px_at_15%_5%,rgba(212,175,55,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_85%_30%,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_90%,rgba(212,175,55,0.04),transparent_60%)]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <a href={`/exclusive/${groupId ?? ""}`} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          ← Back
        </a>

        <div className="mt-6 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs text-amber-200/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Exclusive application
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Apply</h1>
            <p className="mt-2 text-white/60">
              {group ? (
                <>Applying for <span className="font-semibold text-white">{group.title}</span>
                  <span className="text-white/35"> • </span>
                  Price: <span className="font-semibold text-amber-300">₹{group.price}</span>
                </>
              ) : "Loading group..."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur px-5 py-4">
            <p className="text-xs text-white/50">Access</p>
            <p className="mt-1 text-sm font-semibold text-white/90">Member-only</p>
            <p className="mt-1 text-xs text-white/45">Active members only</p>
          </div>
        </div>

        {/* Application form */}
        <div className="mt-8 rounded-3xl border border-white/8 bg-white/4 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            {loading ? (
              <p className="text-sm text-white/50 animate-pulse">Loading...</p>
            ) : (
              <>
                {/* Who is applying */}
                {profile ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/30 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300">
                      {profile.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{profile.name}</div>
                      <div className="text-xs text-white/45">Applying as this account</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
                    You are not logged in. Please{" "}
                    <a href="/login" className="underline font-semibold">login</a> first to apply.
                  </div>
                )}

                {/* Network eligibility section */}
                {profile && !loading && (
                  <div className="mt-6">
                    {!isEligible ? (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-4 text-sm text-red-300">
                        <p className="font-semibold">Not eligible for this group</p>
                        <p className="mt-1 text-red-300/80">
                          This exclusive group requires an active membership on:{" "}
                          <span className="font-semibold text-red-200">
                            {group?.platforms?.map((p) => PLATFORM_LABELS[p] || p).join(", ")}
                          </span>.
                          {" "}Your active memberships are on:{" "}
                          <span className="font-semibold text-red-200">
                            {activeSubs.length > 0
                              ? activeSubs.map((s) => PLATFORM_LABELS[s.network_mode] || s.network_mode).join(", ")
                              : "none"}
                          </span>.
                        </p>
                        <a href="/membership/renew" className="mt-3 inline-block text-xs underline text-red-300/70 hover:text-red-200">
                          Get the right membership →
                        </a>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium text-white/80">
                          Apply via network
                        </label>
                        <p className="mt-1 text-xs text-white/45">
                          Select which of your active memberships to apply with.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {eligibleNetworks.map((net) => (
                            <button
                              key={net}
                              type="button"
                              onClick={() => setSelectedNetwork(net)}
                              className={[
                                "px-4 py-2.5 rounded-2xl border text-sm font-medium transition",
                                selectedNetwork === net
                                  ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/8",
                              ].join(" ")}
                            >
                              {PLATFORM_ICONS[net] || ""} {PLATFORM_LABELS[net] || net}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Result message */}
                {result && (
                  <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                    result.type === "success" ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                    : result.type === "warning" ? "border-amber-500/20 bg-amber-500/8 text-amber-200"
                    : "border-red-500/20 bg-red-500/8 text-red-300"
                  }`}>
                    {result.message}
                    {result.type === "warning" && !profile && (
                      <div className="mt-3">
                        <a href="/login" className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold bg-white text-black hover:bg-white/90 transition text-sm">
                          Login →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                {result?.type !== "success" && (
                  <button
                    onClick={submit}
                    disabled={!profile || submitting || !isEligible || !selectedNetwork}
                    className={[
                      "mt-6 w-full px-6 py-3 rounded-2xl font-semibold transition",
                      profile && isEligible && selectedNetwork && !submitting
                        ? "bg-white text-black hover:bg-amber-50 shadow-sm"
                        : "bg-white/8 border border-white/8 cursor-not-allowed text-white/40",
                    ].join(" ")}
                    type="button"
                  >
                    {submitting ? "Submitting..." : "Apply Now"}
                  </button>
                )}

                <p className="mt-3 text-xs text-white/40">
                  Payment will be handled personally after approval by admin.
                </p>
              </>
            )}
          </div>

          <div className="border-t border-white/8 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/50">
            Already applied? You'll see a confirmation message. Admin will respond soon.
          </div>
        </div>

        {/* Rules & Regulations */}
        <div className="mt-14 rounded-3xl border border-white/8 bg-white/4 backdrop-blur shadow-sm p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs text-amber-200/70 backdrop-blur mb-4">
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            Platform Rules
          </div>
          <h2 className="text-xl font-bold text-white">CityRing — Rules & Regulations</h2>
          <p className="mt-3 text-white/55 text-sm">
            To preserve the integrity and experience of every circle, all members are expected to follow these principles.
          </p>
          <div className="mt-6 space-y-5 text-sm leading-relaxed">
            {RULES.map(([title, body]) => (
              <div key={title}>
                <h3 className="font-semibold text-white/90">{title}</h3>
                <p className="mt-1.5 text-white/50">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}