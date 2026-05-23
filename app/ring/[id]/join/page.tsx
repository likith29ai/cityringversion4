"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { FaInstagram, FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

type NetworkMode = "instagram" | "whatsapp" | "telegram" | "gmail";

type Profile = {
  id: string;
  name: string;
  email: string;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;
  is_member: boolean;
  payment_status: string | null;
};

type Group = {
  id: string;
  platforms: string[];
};

const MODE_ICONS: Record<NetworkMode, React.ReactElement> = {
  instagram: <FaInstagram className="text-lg" />,
  whatsapp:  <FaWhatsapp className="text-lg" />,
  telegram:  <FaTelegramPlane className="text-lg" />,
  gmail:     <MdEmail className="text-lg" />,
};

const MODE_LABELS: Record<NetworkMode, string> = {
  instagram: "Instagram",
  whatsapp:  "WhatsApp",
  telegram:  "Telegram",
  gmail:     "Gmail",
};

export default function JoinNowPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [notMember, setNotMember] = useState(false);
  const [mode, setMode] = useState<NetworkMode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!groupId) return;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setNotLoggedIn(true); setLoading(false); return; }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, instagram, whatsapp, telegram, is_member, payment_status")
        .eq("email", session.user.email!)
        .maybeSingle();

      if (!profileData) { setNotLoggedIn(true); setLoading(false); return; }

      if (!profileData.is_member || profileData.payment_status !== "verified") {
        setProfile(profileData as Profile);
        setNotMember(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      const { data: groupData } = await supabase
        .from("groups")
        .select("id, platforms")
        .eq("id", groupId)
        .maybeSingle();

      setGroup(groupData as Group);

      const modes = getAvailableModes(profileData as Profile, groupData?.platforms || []);
      if (modes.length === 1) setMode(modes[0]);
      setLoading(false);
    }
    load();
  }, [groupId]);

  function getAvailableModes(p: Profile, groupPlatforms: string[]): NetworkMode[] {
    const plat = groupPlatforms.map(x => x.toLowerCase());
    const noFilter = plat.length === 0;
    const out: NetworkMode[] = [];
    if (p.instagram && (noFilter || plat.includes("instagram"))) out.push("instagram");
    if (p.whatsapp  && (noFilter || plat.includes("whatsapp")))  out.push("whatsapp");
    if (p.telegram  && (noFilter || plat.includes("telegram")))  out.push("telegram");
    if (p.email     && (noFilter || plat.includes("gmail")))     out.push("gmail");
    return out;
  }

  function getContactValue(p: Profile, m: NetworkMode): string {
    if (m === "instagram") return `@${p.instagram}`;
    if (m === "whatsapp")  return p.whatsapp || "";
    if (m === "telegram")  return p.telegram || "";
    if (m === "gmail")     return p.email || "";
    return "";
  }

  async function submit() {
    if (!profile || !groupId || !mode || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc("request_join_group_v2", {
        _profile_id: profile.id,
        _group_id: groupId,
        _network_mode: mode,
      });
      if (error) {
        const msg = error.message || "";
        if (msg.includes("MEMBERSHIP_EXPIRED")) {
          setResult({ type: "warning", message: "Your membership has expired. Please renew to join groups." });
        } else if (msg.includes("MEMBERSHIP_NOT_ACTIVE")) {
          setResult({ type: "warning", message: "Membership not active yet. Please wait for approval." });
        } else throw error;
        setSubmitting(false);
        return;
      }
      setResult({
        type: "success",
        message: data === "already_requested"
          ? "✅ Already requested!."
          : "✅ Request sent! joining link will be sent to your respective gmail.",
      });
    } catch (e: any) {
      setResult({ type: "error", message: e?.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const groupPlatforms = (group?.platforms || []).map(p => p.toLowerCase());
  const availableModes = profile ? getAvailableModes(profile, groupPlatforms) : [];

  return (
    <main className="min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <a href={`/ring/${groupId ?? ""}`} className="text-sm text-blue-400 hover:text-blue-300 transition">
          ← Back to Ring
        </a>
        <h1 className="mt-3 text-4xl font-bold">Join Now</h1>

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/40 animate-pulse">Loading your details…</p>
          </div>
        )}

        {/* Not logged in */}
        {!loading && notLoggedIn && (
          <div className="mt-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-white/40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Sign in to join this ring</h2>
            <p className="mt-2 text-sm text-white/50">You need to be signed in as a CityRing member to request to join.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a href={`/login?redirect=/ring/${groupId}/join`} className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition">Sign in</a>
              <a href="/register" className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition">Register</a>
            </div>
          </div>
        )}

        {/* Not a member */}
        {!loading && notMember && profile && (
          <div className="mt-8 rounded-2xl sm:rounded-3xl border border-orange-500/20 bg-orange-500/10 backdrop-blur p-8 text-center">
            <h2 className="text-xl font-semibold text-orange-300">Membership not active</h2>
            <p className="mt-2 text-sm text-white/60">
              Hi {profile.name}, your membership is not active yet. You need an active membership to join rings.
            </p>
            <a href="/dashboard" className="mt-6 inline-block px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 transition">
              Check Dashboard →
            </a>
          </div>
        )}

        {/* Main form */}
        {!loading && !notLoggedIn && !notMember && profile && (
          <div className="mt-8 space-y-4">

            {/* User card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active Member
                </p>
              </div>
            </div>

            {/* Platform selector */}
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold tracking-tight">How would you like to connect?</h2>
                <p className="mt-2 text-sm text-white/65">Choose which contact to share with this group.</p>

                {availableModes.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                    You don't have a matching network for this group.{" "}
                    <a href="/dashboard" className="underline">Add service from dashboard →</a>
                  </div>
                )}

                {availableModes.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableModes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        type="button"
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-white/10 ${
                          mode === m
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                            : "border-white/10 bg-black/35 hover:bg-black/55 text-white/80"
                        }`}
                      >
                        <span className="text-lg leading-none">{MODE_ICONS[m]}</span>
                        <span>{MODE_LABELS[m]}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected contact preview */}
                {mode && (
                  <div className="mt-5 rounded-xl border border-white/5 bg-black/20 px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-white/40">The joining link will be shared with you via email. Please use it to join.</p>
                    <p className="text-sm font-medium text-white">{getContactValue(profile, mode)}</p>
                  </div>
                )}

                {/* Result message */}
                {result && (
                  <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    result.type === "success" ? "border-green-500/20 bg-green-500/10 text-green-200"
                    : result.type === "warning" ? "border-orange-500/20 bg-orange-500/10 text-orange-200"
                    : "border-red-500/20 bg-red-500/10 text-red-200"
                  }`}>
                    {result.message}
                    {result.type === "warning" && result.message.includes("expired") && (
                      <a href="/membership/renew" className="ml-2 underline">Renew →</a>
                    )}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
                  <p className="text-sm text-white/65">
                    {mode ? `Joining via ${MODE_LABELS[mode]}` : "Select a network above"}
                  </p>
                  <button
                    onClick={submit}
                    disabled={!mode || submitting || availableModes.length === 0}
                    type="button"
                    className={`px-4 sm:px-6 py-3 rounded-2xl font-semibold transition ${
                      mode && !submitting
                        ? "bg-white text-black hover:bg-white/90 shadow-sm"
                        : "bg-white/10 border border-white/10 cursor-not-allowed text-white/60 shadow-none"
                    }`}
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/60">
                Upon review of your request, a joining link will be sent to your registered email address.
              </div>
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="mt-16 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm p-8">
          <h2 className="text-2xl font-bold text-white">CityRing — Rules & Regulations</h2>
          <p className="mt-4 text-white/70">
            To preserve the integrity and experience of every circle, all members are expected to follow these principles.
          </p>
          <div className="mt-6 space-y-6 text-sm leading-relaxed">
            {[
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
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-white/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}