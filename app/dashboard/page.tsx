"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { FaInstagram, FaWhatsapp, FaTelegramPlane, FaGlobe } from "react-icons/fa";

type Profile = {
  id: string;
  name: string;
  email: string;
  network_mode: string;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;
  is_member: boolean;
};

type Subscription = {
  id: string;
  profile_id: string;
  plan_id: string;
  plan_price: number | null;
  group_limit: number;
  groups_used: number;
  status: string;
  network_mode: string;
  upi_txn_id: string | null;
  rejection_reason: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:            { label: "Active",            color: "text-emerald-300", bg: "border-emerald-500/20 bg-emerald-500/10", dot: "bg-emerald-400" },
  pending_approval:  { label: "Verifying Payment", color: "text-yellow-300",  bg: "border-yellow-500/20 bg-yellow-500/10",  dot: "bg-yellow-400" },
  pending:           { label: "Awaiting Payment",  color: "text-blue-300",    bg: "border-blue-500/20 bg-blue-500/10",      dot: "bg-blue-400"   },
  rejected:          { label: "Payment Failed",    color: "text-red-300",     bg: "border-red-500/20 bg-red-500/10",        dot: "bg-red-400"    },
  expired:           { label: "Expired",           color: "text-white/40",    bg: "border-white/10 bg-white/5",             dot: "bg-white/30"   },
};

const MODE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp:  "WhatsApp",
  telegram:  "Telegram",
  all:       "All Networks",
};

const MODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  instagram: { bg: "bg-pink-500/10",   border: "border-pink-500/20",   text: "text-pink-300"   },
  whatsapp:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-300"  },
  telegram:  { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-300"   },
  all:       { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-300" },
};

function ModeIcon({ mode, className }: { mode: string; className?: string }) {
  if (mode === "instagram") return <FaInstagram className={className} />;
  if (mode === "whatsapp")  return <FaWhatsapp className={className} />;
  if (mode === "telegram")  return <FaTelegramPlane className={className} />;
  return <FaGlobe className={className} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const [confirmDropId, setConfirmDropId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id,name,email,network_mode,instagram,whatsapp,telegram,is_member")
        .eq("email", session.user.email!)
        .single();

      if (error || !profileData) { router.replace("/login"); return; }
      setProfile(profileData as Profile);

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("created_at", { ascending: false });

      setSubscriptions((subs as Subscription[]) || []);
      setLoading(false);
    }
    load();
  }, [router]);

  function goToPayment(sub: Subscription) {
    localStorage.setItem("cityring_profile_id", profile!.id);
    localStorage.setItem("cityring_subscription_id", sub.id);
    localStorage.setItem("selectedPlan", JSON.stringify({
      plan_id: sub.plan_id,
      plan_price: sub.plan_price,
      plan_group_limit: sub.group_limit,
      is_renewal: false,
    }));
    router.push("/register/payment");
  }

  function goToAddService(networkMode: string) {
    if (!profile) return;
    localStorage.setItem("cityring_profile_id", profile.id);
    localStorage.setItem("cityring_add_service_mode", networkMode);
    router.push("/dashboard/add-service");
  }

  async function dropSubscription(subId: string) {
    setDroppingId(subId);
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subId);
    if (!error) {
      setSubscriptions(prev => prev.filter(s => s.id !== subId));
    }
    setDroppingId(null);
    setConfirmDropId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07070A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const allModes = ["instagram", "whatsapp", "telegram"];
  const subscribedNetworks = new Set<string>();
  // FIX #7: Only count active/pending subscriptions — expired/rejected should allow re-subscribe
  subscriptions
    .filter(sub => ["active", "pending_approval", "pending"].includes(sub.status))
    .forEach(sub => {
      if (sub.network_mode === "all") {
        subscribedNetworks.add("instagram");
        subscribedNetworks.add("whatsapp");
        subscribedNetworks.add("telegram");
      } else {
        subscribedNetworks.add(sub.network_mode);
      }
    });

  const availableNetworks = allModes.filter(m => !subscribedNetworks.has(m));
  const hasAnySubscription = subscriptions.length > 0;
  const hasAllSubscription = subscriptions.some(s => s.network_mode === "all");
  const canAddAllNetworks = !hasAllSubscription && availableNetworks.length > 1;

  const activeCount = subscriptions.filter(s => s.status === "active").length;
  const totalGroups = subscriptions.reduce((sum, s) => sum + (s.groups_used || 0), 0);
  const totalLimit = subscriptions.reduce((sum, s) => sum + (s.group_limit || 0), 0);

  return (
    <main className="min-h-screen bg-[#07070A] text-white">
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome back, {profile.name}!</h1>
          <p className="mt-2 text-white/50">{profile.email}</p>

          {subscriptions.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/[0.08] transition">
                <p className="text-white/60 text-sm font-medium">Active Plans</p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/[0.08] transition">
                <p className="text-white/60 text-sm font-medium">Total Networks</p>
                <p className="mt-2 text-3xl font-bold text-blue-400">{subscribedNetworks.size}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/[0.08] transition">
                <p className="text-white/60 text-sm font-medium">Groups Used</p>
                <p className="mt-2 text-3xl font-bold text-purple-400">{totalGroups}/{totalLimit}</p>
                <p className="mt-1 text-xs text-white/40">{totalLimit - totalGroups} remaining</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/[0.08] transition">
                <p className="text-white/60 text-sm font-medium">Groups Available</p>
                <p className="mt-2 text-3xl font-bold text-pink-400">{totalLimit - totalGroups}</p>
                <p className="mt-1 text-xs text-white/40">slots ready to join</p>
              </div>
            </div>
          )}
        </div>

        {/* No subscriptions — show welcome message inline with add networks below */}
        {subscriptions.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur p-8 text-center">
            <p className="text-2xl font-semibold text-white">Get Started Today</p>
            <p className="mt-2 text-white/60">Choose a network below to register and start growing your reach.</p>
          </div>
        )}

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Services</h2>
              <span className="text-sm text-white/50">{subscriptions.length} {subscriptions.length === 1 ? "plan" : "plans"}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subscriptions.map((sub) => {
                const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                const modeColor = MODE_COLORS[sub.network_mode] || MODE_COLORS.all;
                const usage = sub.group_limit > 0 ? Math.round((sub.groups_used / sub.group_limit) * 100) : 0;

                return (
                  <div key={sub.id} className={`rounded-3xl border overflow-hidden backdrop-blur transition hover:shadow-lg hover:shadow-white/5 ${modeColor.border} ${modeColor.bg}`}>
                    {/* Card Header */}
                    <div className="px-6 py-4 border-b border-white/10 bg-black/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ModeIcon mode={sub.network_mode} className={`text-2xl ${modeColor.text}`} />
                          <div>
                            <p className="font-semibold text-lg">
                              {sub.network_mode === "all" ? "All Networks Bundle" : MODE_LABELS[sub.network_mode]}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              Plan: <span className="text-white/60 font-mono">{sub.plan_id}</span>
                            </p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${cfg.color} text-xs font-semibold`}>
                          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-5 space-y-4">
                      {/* Contact details */}
                      {sub.network_mode === "all" ? (
                        <div className="space-y-2 text-sm">
                          {profile.instagram && (
                            <div className="flex items-center gap-2 text-white/70">
                              <FaInstagram className="text-pink-400 shrink-0" />
                              <span className="font-mono text-white/90">@{profile.instagram}</span>
                            </div>
                          )}
                          {profile.whatsapp && (
                            <div className="flex items-center gap-2 text-white/70">
                              <FaWhatsapp className="text-green-400 shrink-0" />
                              <span className="font-mono text-white/90">{profile.whatsapp}</span>
                            </div>
                          )}
                          {profile.telegram && (
                            <div className="flex items-center gap-2 text-white/70">
                              <FaTelegramPlane className="text-blue-400 shrink-0" />
                              <span className="font-mono text-white/90">@{profile.telegram}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-white/70">
                          {sub.network_mode === "instagram" && profile.instagram && (
                            <div className="flex items-center gap-2"><FaInstagram className="text-pink-400 shrink-0" /><span className="font-mono">@{profile.instagram}</span></div>
                          )}
                          {sub.network_mode === "whatsapp" && profile.whatsapp && (
                            <div className="flex items-center gap-2"><FaWhatsapp className="text-green-400 shrink-0" /><span className="font-mono">{profile.whatsapp}</span></div>
                          )}
                          {sub.network_mode === "telegram" && profile.telegram && (
                            <div className="flex items-center gap-2"><FaTelegramPlane className="text-blue-400 shrink-0" /><span className="font-mono">@{profile.telegram}</span></div>
                          )}
                        </div>
                      )}

                      {/* Usage bar */}
                      {sub.status === "active" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-white/80">Groups Used</p>
                            <p className="text-sm font-mono text-white/60">{sub.groups_used} / {sub.group_limit}</p>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all ${usage > 80 ? "bg-red-400" : usage > 50 ? "bg-yellow-400" : "bg-emerald-400"}`}
                              style={{ width: `${Math.min(usage, 100)}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-white/40">{sub.group_limit - sub.groups_used} groups remaining</p>
                        </div>
                      )}

                      {sub.plan_price && (
                        <div className="flex items-baseline gap-2 pt-2 border-t border-white/10">
                          <span className="text-2xl font-bold">₹{sub.plan_price}</span>
                          <span className="text-xs text-white/40">/month</span>
                        </div>
                      )}
                    </div>

                    {/* Status actions */}
                    {sub.status === "pending_approval" && (
                      <div className="px-6 py-4 bg-yellow-500/10 border-t border-yellow-500/20 space-y-1">
                        <p className="text-sm text-yellow-200 font-medium">Verifying your payment</p>
                        {sub.upi_txn_id && <p className="text-xs text-white/50 font-mono">Transaction ID: {sub.upi_txn_id}</p>}
                        <p className="text-xs text-yellow-300/70">Our team is reviewing your payment. This usually takes 1-2 hours.</p>
                      </div>
                    )}
                    {sub.status === "pending" && (
                      <div className="px-6 py-4 bg-blue-500/10 border-t border-blue-500/20 space-y-2">
                        <button onClick={() => goToPayment(sub)} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition">
                          Complete Payment →
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem("cityring_profile_id", profile!.id);
                            localStorage.setItem("cityring_renew_network_mode", sub.network_mode);
                            router.push("/membership/renew");
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition"
                        >
                          Change Plan
                        </button>
                      </div>
                    )}
                    {sub.status === "rejected" && (
                      <div className="px-6 py-4 bg-red-500/10 border-t border-red-500/20 space-y-2">
                        <div className="mb-1">
                          <p className="text-sm text-red-200 font-semibold">Payment Failed</p>
                          {sub.rejection_reason && <p className="text-xs text-white/60 mt-1">Reason: {sub.rejection_reason}</p>}
                        </div>
                        <button onClick={() => goToPayment(sub)} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition">
                          Retry Payment →
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem("cityring_profile_id", profile!.id);
                            localStorage.setItem("cityring_renew_network_mode", sub.network_mode);
                            router.push("/membership/renew");
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/10 transition"
                        >
                          Change Plan
                        </button>
                      </div>
                    )}
                    {sub.status === "expired" && (
                      <div className="px-6 py-4 bg-white/5 border-t border-white/10 space-y-2">
                        <button
                          onClick={() => {
                            localStorage.setItem("cityring_profile_id", profile!.id);
                            localStorage.setItem("cityring_renew_network_mode", sub.network_mode);
                            router.push("/membership/renew");
                          }}
                          className="block w-full px-4 py-3 rounded-xl border border-white/20 text-white font-semibold text-center hover:bg-white/10 transition"
                        >
                          Renew Now
                        </button>
                        {confirmDropId === sub.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => dropSubscription(sub.id)}
                              disabled={droppingId === sub.id}
                              className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
                            >
                              {droppingId === sub.id ? "Dropping…" : "Yes, Drop"}
                            </button>
                            <button
                              onClick={() => setConfirmDropId(null)}
                              className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-medium hover:bg-white/10 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDropId(sub.id)}
                            className="w-full px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 text-sm font-medium hover:bg-red-500/10 hover:text-red-300 transition"
                          >
                            Drop
                          </button>
                        )}
                      </div>
                    )}

                    {/* Drop button for non-expired statuses */}
                    {sub.status !== "expired" && (
                      <div className="px-6 pb-4 pt-0">
                        {confirmDropId === sub.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => dropSubscription(sub.id)}
                              disabled={droppingId === sub.id}
                              className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
                            >
                              {droppingId === sub.id ? "Dropping…" : "Yes, Drop"}
                            </button>
                            <button
                              onClick={() => setConfirmDropId(null)}
                              className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white/60 text-sm font-medium hover:bg-white/10 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDropId(sub.id)}
                            className="w-full px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 text-sm font-medium hover:bg-red-500/10 hover:text-red-300 transition"
                          >
                            Drop
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Services — always show when networks are available */}
        {availableNetworks.length > 0 && (
          <div className="space-y-6">

            {/* Individual Networks + All Three */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8">
              <h3 className="text-xl font-bold mb-6">Add More Networks</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableNetworks.map((mode) => {
                  const color = MODE_COLORS[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => goToAddService(mode)}
                      className={`p-6 rounded-2xl border-2 ${color.border} ${color.bg} hover:bg-white/10 transition text-left`}
                    >
                      <ModeIcon mode={mode} className={`text-3xl mb-3 block ${color.text}`} />
                      <p className="font-semibold text-base text-white">{MODE_LABELS[mode]}</p>
                      <p className="text-xs text-white/50 mt-1">Separate plan & payment</p>
                    </button>
                  );
                })}

                {/* All Three option — always shown when 2+ networks available */}
                {canAddAllNetworks && (
                  <button
                    onClick={() => {
                      if (!profile) return;
                      localStorage.setItem("cityring_profile_id", profile.id);
                      localStorage.setItem("cityring_add_service_mode", "all");
                      router.push("/dashboard/add-service");
                    }}
                    className="p-6 rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition text-left"
                  >
                    <FaGlobe className="text-3xl mb-3 block text-purple-400" />
                    <p className="font-semibold text-base text-white">All Three</p>
                    <p className="text-xs text-white/50 mt-1">One plan for all networks</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All covered */}
        {availableNetworks.length === 0 && subscriptions.length > 0 && (
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 backdrop-blur p-8 text-center">
            <div className="flex justify-center gap-3 text-3xl mb-3">
              <FaInstagram className="text-pink-400" />
              <FaWhatsapp className="text-green-400" />
              <FaTelegramPlane className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">All Networks Covered!</p>
            <p className="mt-2 text-white/60">Your account is fully equipped with Instagram, WhatsApp, and Telegram networks.</p>
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          <p>Need help? <a href="/contact" className="text-white/60 hover:text-white transition">Contact support</a></p>
        </footer>

      </div>
    </main>
  );
}