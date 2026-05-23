"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from  "../../../lib/supabaseClient";

type Plan = {
  id: string;
  title: string;
  subtitle: string | null;
  price: number;
  group_limit: number;
};

type Profile = {
  id: string;
  instagram: string | null;
  whatsapp: string | null;
  telegram: string | null;
};

const MODE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  all: "All Networks",
};

const MODE_FIELDS: Record<string, { label: string; placeholder: string }> = {
  instagram: { label: "Instagram Username *", placeholder: "eg: yourhandle" },
  whatsapp:  { label: "WhatsApp Number *",    placeholder: "eg: +91 9876543210" },
  telegram:  { label: "Telegram Username *",  placeholder: "eg: @username or Number" },
};

export default function AddServicePage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // For "all" mode, we track all three networks
  const [networkValues, setNetworkValues] = useState({
    instagram: "",
    whatsapp: "",
    telegram: "",
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [plansLoading, setPlansLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const pid = localStorage.getItem("cityring_profile_id");
      const mode = localStorage.getItem("cityring_add_service_mode");
      if (!pid || !mode) { router.replace("/dashboard"); return; }

      setProfileId(pid);
      setNetworkMode(mode);

      // Load profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,instagram,whatsapp,telegram")
        .eq("id", pid)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        // Pre-fill network values from profile (for "all" mode)
        setNetworkValues({
          instagram: profileData.instagram || "",
          whatsapp: profileData.whatsapp || "",
          telegram: profileData.telegram || "",
        });
      }

      const { data } = await supabase
        .from("membership_plans")
        .select("id,title,subtitle,price,group_limit")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setPlans((data as Plan[]) || []);
      setPlansLoading(false);
    }
    load();
  }, [router]);

  const selectedPlan = useMemo(() => plans.find(p => p.id === planId) || null, [plans, planId]);

  // For "all" mode, validate that all three networks are filled
  const isValid = useMemo(() => {
    if (!profileId || !planId || submitting) return false;

    if (networkMode === "all") {
      return (
        networkValues.instagram.trim().length > 0 &&
        networkValues.whatsapp.trim().length > 0 &&
        networkValues.telegram.trim().length > 0
      );
    } else {
      // Single network mode
      const contactValue = networkValues[networkMode as keyof typeof networkValues];
      return contactValue.trim().length > 0;
    }
  }, [profileId, planId, submitting, networkMode, networkValues]);

  async function handleContinue() {
    if (!isValid || !selectedPlan || !profileId) return;
    setSubmitting(true);

    try {
      const updateData: Record<string, string> = {};

      if (networkMode === "all") {
        // Update all three network fields
        updateData.instagram = networkValues.instagram.trim();
        updateData.whatsapp = networkValues.whatsapp.trim();
        updateData.telegram = networkValues.telegram.trim();
      } else {
        // Update single network field
        updateData[networkMode] = networkValues[networkMode as keyof typeof networkValues].trim();
      }

      // Update profile with new network details
      await supabase
        .from("profiles")
        .update({ ...updateData, network_mode: networkMode === "all" ? "all" : networkMode })
        .eq("id", profileId);

      // Create a new pending subscription
      const { data: newSub, error: subErr } = await supabase
        .from("subscriptions")
        .insert({
          profile_id: profileId,
          plan_id: selectedPlan.id,
          plan_price: selectedPlan.price,
          group_limit: selectedPlan.group_limit,
          groups_used: 0,
          status: "pending",
          network_mode: networkMode, // This will be "all" for all-networks
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (subErr) throw subErr;

      // Store for payment page
      localStorage.setItem("cityring_subscription_id", newSub.id);
      localStorage.setItem("selectedPlan", JSON.stringify({
        plan_id: selectedPlan.id,
        plan_price: selectedPlan.price,
        plan_group_limit: selectedPlan.group_limit,
        is_renewal: false,
      }));
      localStorage.removeItem("cityring_add_service_mode");

      window.location.href = "/register/payment";
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
      setSubmitting(false);
    }
  }

  if (!networkMode) return null;

  const isAllMode = networkMode === "all";

  return (
    <main className="min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,white,0.10),transparent_60%)]" />
      </div>

       

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-purple-500/80" />
            {isAllMode ? "Adding All Networks" : `Adding ${MODE_LABELS[networkMode]} Service`}
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
            {isAllMode ? "Add All Networks" : `Add ${MODE_LABELS[networkMode]}`}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {isAllMode
              ? "Combine your existing networks with new ones under a single subscription plan."
              : `Choose a plan and enter your ${MODE_LABELS[networkMode]} details, then complete payment.`}
          </p>
        </div>

        {/* Network Details Section */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <h2 className="text-lg font-semibold">
            {isAllMode ? "Your Network Details" : `Your ${MODE_LABELS[networkMode]} Details`}
          </h2>
          
          {isAllMode ? (
            // All networks mode - show all three fields
            <div className="mt-4 space-y-4">
              {["instagram", "whatsapp", "telegram"].map((network) => (
                <div key={network}>
                  <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                    {MODE_FIELDS[network]?.label}
                    {networkValues[network as keyof typeof networkValues] && (
                      <span className="text-xs text-emerald-300">✓ Filled</span>
                    )}
                  </label>
                  <input
                    value={networkValues[network as keyof typeof networkValues]}
                    onChange={(e) =>
                      setNetworkValues({ ...networkValues, [network]: e.target.value })
                    }
                    placeholder={MODE_FIELDS[network]?.placeholder}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-200">
                  💡 Tip: If you already have Instagram, WhatsApp, or Telegram details in your profile, they'll be pre-filled above. Update them if needed.
                </p>
              </div>
            </div>
          ) : (
            // Single network mode
            <div className="mt-4">
              <label className="text-sm font-medium text-white/80">
                {MODE_FIELDS[networkMode]?.label}
              </label>
              <input
                value={networkValues[networkMode as keyof typeof networkValues]}
                onChange={(e) =>
                  setNetworkValues({ ...networkValues, [networkMode]: e.target.value })
                }
                placeholder={MODE_FIELDS[networkMode]?.placeholder}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
        </div>

        {/* Plan selector */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Choose a Plan</h2>
            <p className="mt-1 text-sm text-white/50">
              {isAllMode
                ? "Select a plan that covers all three networks."
                : `This is a separate plan for your ${MODE_LABELS[networkMode]} service.`}
            </p>

            {plansLoading && <p className="mt-4 text-sm text-white/40">Loading plans…</p>}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((p) => {
                const active = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`text-left rounded-2xl border p-5 transition ${
                      active ? "border-blue-500/40 bg-blue-500/10" : "border-white/10 bg-black/35 hover:bg-black/55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">{p.title}</div>
                        <div className="text-xs text-white/50 mt-0.5">{p.subtitle}</div>
                        <div className="text-xs text-white/40 mt-1">
                          Up to <span className="text-white font-medium">{p.group_limit}</span> groups
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${active ? "text-blue-200" : "text-white"}`}>
                        ₹{p.price}
                      </div>
                    </div>
                    {active && (
                      <div className="mt-3 text-xs text-blue-300 font-medium">✓ Selected</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/20 px-6 py-4 text-xs text-white/40">
            You'll pay via UPI on the next screen.
          </div>
        </div>

        {/* Summary + CTA */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-white/50">Amount to pay</p>
              <p className="mt-1 text-2xl font-bold">
                {selectedPlan ? `₹${selectedPlan.price}` : "—"}
              </p>
              {isAllMode && selectedPlan && (
                <p className="mt-2 text-xs text-white/40">
                  Covers: Instagram, WhatsApp & Telegram
                </p>
              )}
            </div>
            <button
              onClick={handleContinue}
              disabled={!isValid}
              className={[
                "px-6 py-3 rounded-2xl font-semibold transition",
                isValid
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10",
              ].join(" ")}
            >
              {submitting ? "Setting up…" : "Continue to Payment →"}
            </button>
          </div>
        </div>

        {/* Info box for All Networks mode */}
        {isAllMode && (
          <div className="rounded-2xl sm:rounded-3xl border border-purple-500/20 bg-purple-500/10 p-5">
            <h3 className="font-semibold text-white mb-2">✨ All Networks Subscription</h3>
            <ul className="text-sm text-white/70 space-y-1">
              <li>✓ Single plan covers Instagram, WhatsApp & Telegram</li>
              <li>✓ Pay once for all three networks</li>
              <li>✓ Manage all networks from one dashboard</li>
              <li>✓ Keep your existing single-network subscriptions active</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}