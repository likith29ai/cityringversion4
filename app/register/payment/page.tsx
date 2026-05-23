"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type SelectedPlanLS = {
  plan_id: string;
  plan_price: number;
  plan_group_limit: number;
  is_renewal?: boolean;
};

export default function PaymentPage() {
  const [txnId, setTxnId] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanLS | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawDraft = localStorage.getItem("cityring_register_draft");
    if (rawDraft) setDraft(JSON.parse(rawDraft));

    const pid = localStorage.getItem("cityring_profile_id");
    if (pid) setProfileId(pid);

    const sid = localStorage.getItem("cityring_subscription_id");
    if (sid) setSubscriptionId(sid);

    const rawSelected = localStorage.getItem("selectedPlan");
    if (rawSelected) setSelectedPlan(JSON.parse(rawSelected));
  }, []);

  const amount = useMemo(() => {
    const n = Number(selectedPlan?.plan_price ?? draft?.plan_price);
    return Number.isFinite(n) && n > 0 ? n : 99;
  }, [draft, selectedPlan]);

  const canSubmit = useMemo(() => {
    return !!profileId && !!selectedPlan && txnId.trim().length >= 6 && !submitting;
  }, [profileId, selectedPlan, txnId, submitting]);

  async function submit() {
    if (!profileId || !selectedPlan) {
      alert("Profile or plan not found. Please go back and try again.");
      window.location.href = "/register";
      return;
    }

    const cleanTxn = txnId.trim();
    if (cleanTxn.length < 6) return;

    setSubmitting(true);

    try {
      // If we have a specific subscription ID (add-service flow), update it
      // Otherwise find the most recent pending subscription for this profile
      let subId = subscriptionId;

      if (!subId) {
        const networkMode = draft?.mode || "instagram";

        // First: look for pending subscription — filter by network_mode
        // to avoid grabbing the wrong network's subscription row
        const { data: pendingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("profile_id", profileId)
          .eq("status", "pending")
          .eq("network_mode", networkMode)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        subId = pendingSub?.id || null;

        // If still not found: look for ANY existing subscription by network_mode
        // (covers renew flow where status is expired/rejected)
        if (!subId) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("profile_id", profileId)
            .eq("network_mode", networkMode)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          subId = existingSub?.id || null;
        }
      }

      if (subId) {
        // Update subscription with payment info
        const { error: subErr } = await supabase
          .from("subscriptions")
          .update({
            upi_txn_id: cleanTxn,
            plan_price: Number(selectedPlan.plan_price),
            status: "pending_approval",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subId);

        if (subErr) throw subErr;
      } else {
        // Fallback: create subscription if none exists
        const { error: insertErr } = await supabase
          .from("subscriptions")
          .insert({
            profile_id: profileId,
            plan_id: selectedPlan.plan_id,
            plan_price: Number(selectedPlan.plan_price),
            group_limit: Number(selectedPlan.plan_group_limit) || 0,
            groups_used: 0,
            upi_txn_id: cleanTxn,
            status: "pending_approval",
            network_mode: draft?.mode || "instagram",
            updated_at: new Date().toISOString(),
          });

        if (insertErr) throw insertErr;
      }

      // Also update profile payment status
      await supabase
        .from("profiles")
        .update({
          upi_txn_id: cleanTxn,
          payment_status: "pending",
          plan_id: selectedPlan.plan_id,
          plan_price: Number(selectedPlan.plan_price),
        })
        .eq("id", profileId);

      // Clean up localStorage
      localStorage.removeItem("cityring_subscription_id");

      alert("✅ Payment submitted! Admin will verify and activate your membership.");

      const returnTo = localStorage.getItem("renew_return_to");
      if (selectedPlan?.is_renewal && returnTo) {
        localStorage.removeItem("renew_return_to");
        window.location.href = returnTo;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e: any) {
      console.error(e);
      alert(`Something went wrong: ${e.message}`);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen text-white">
      {/* Dark premium background */}
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.04))]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Secure UPI Checkout
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              Finish your membership payment
            </h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Scan the QR, pay the exact amount, then paste your transaction (UTR) ID.
              Admin will verify and activate your membership.
            </p>
          </div>

          {/* Amount pill */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
            <p className="text-xs text-white/60">Payable Amount</p>
            <p className="mt-1 text-2xl font-bold">₹{amount}</p>
            <p className="mt-1 text-xs text-white/60">
              Group limit: {selectedPlan?.plan_group_limit ?? draft?.plan_group_limit ?? "—"}
            </p>
          </div>
        </div>

        {/* Warnings */}
        <div className="mt-6 space-y-3">
          {!selectedPlan && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Plan not found. Please go back and select a plan again.
            </div>
          )}
          {selectedPlan && !profileId && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Profile not found. Please register again.
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: QR */}
          <section className="lg:col-span-7">
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold">Scan & Pay</h2>
                    <p className="mt-2 text-sm text-white/70">
                      Use any UPI app (GPay / PhonePe / Paytm). Pay exactly{" "}
                      <span className="font-semibold text-white">₹{amount}</span>.
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                    UPI • Instant
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* QR Card */}
                  <div className="md:col-span-6">
                    <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5">
                      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-[radial-gradient(600px_240px_at_50%_0%,rgba(255,255,255,0.10),transparent_65%)]" />
                      <div className="relative rounded-2xl border border-white/10 bg-white p-4 flex flex-col items-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=likith200305@oksbi&pn=CityRing&am=${amount}&cu=INR&tn=CityRing+Membership`)}`}
                          alt="UPI QR Code"
                          className="w-full max-w-[200px] rounded-xl"
                        />
                        <p className="mt-3 text-xs text-zinc-500 text-center">Scan with any UPI app</p>
                        <div className="mt-2 flex items-center justify-center w-full text-xs text-zinc-500 border-t border-zinc-200 pt-2">
                          <span className="font-bold text-zinc-800">₹{amount}</span>
                        </div>
                      </div>
                      <p className="relative mt-3 text-xs text-white/50 text-center">
                        Make sure your UPI app shows{" "}
                        <span className="text-emerald-400 font-medium">Successful</span>.
                      </p>
                    </div>
                  </div>

                  {/* UPI App Buttons + Checklist */}
                  <div className="md:col-span-6 space-y-4">
                    {/* Pay directly via app */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-sm font-semibold text-white/90 mb-3">Or open directly in app</h3>
                      <div className="space-y-2">
                        <a
                          href={`gpay://upi/pay?pa=likith200305@oksbi&pn=CityRing&am=${amount}&cu=INR&tn=CityRing+Membership`}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-6 w-auto" />
                          <span className="text-sm font-medium text-white">Google Pay</span>
                          <span className="ml-auto text-xs text-white/50">₹{amount} →</span>
                        </a>
                        <a
                          href={`phonepe://pay?pa=likith200305@oksbi&pn=CityRing&am=${amount}&cu=INR&tn=CityRing+Membership`}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                        >
                          <svg className="h-6 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100" height="30" rx="4" fill="#5f259f"/>
                            <text x="8" y="21" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="white">PhonePe</text>
                          </svg>
                          <span className="text-sm font-medium text-white">PhonePe</span>
                          <span className="ml-auto text-xs text-white/50">₹{amount} →</span>
                        </a>
                        <a
                          href={`paytmmp://pay?pa=likith200305@oksbi&pn=CityRing&am=${amount}&cu=INR&tn=CityRing+Membership`}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png" alt="Paytm" className="h-6 w-auto" />
                          <span className="text-sm font-medium text-white">Paytm</span>
                          <span className="ml-auto text-xs text-white/50">₹{amount} →</span>
                        </a>
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-sm font-semibold text-white/90">Before you submit</h3>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        <li className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                          Pay exactly ₹{amount}
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                          Copy Transaction/UTR ID from UPI history
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                          Paste it and submit for verification
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/60">
                If you entered the wrong transaction ID, you can resubmit from your dashboard.
              </div>
            </div>
          </section>

          {/* Right: Transaction */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-semibold">Transaction</h2>
                <p className="mt-2 text-sm text-white/70">
                  Enter your UPI Transaction/UTR ID to complete verification.
                </p>

                <div className="mt-6">
                  <label className="text-sm font-medium text-white/80">
                    UPI Transaction ID <span className="text-red-300">*</span>
                  </label>
                  <input
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20"
                    placeholder="eg: 1234567890 / UTR..."
                  />
                  <p className="mt-2 text-xs text-white/50">
                    Found in your UPI app → transaction details.
                  </p>
                </div>

                {/* Total box */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">Total</p>
                    <p className="text-lg font-bold text-white">₹{amount}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                    <span>Plan</span>
                    <span className="font-medium text-white/70">{selectedPlan?.plan_id ?? "—"}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                    <span>Group limit</span>
                    <span className="font-medium text-white/70">
                      {selectedPlan?.plan_group_limit ?? draft?.plan_group_limit ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    disabled={!canSubmit}
                    onClick={submit}
                    className={[
                      "w-full rounded-2xl px-4 sm:px-6 py-3 font-semibold shadow-sm transition",
                      canSubmit
                        ? "bg-white text-black hover:bg-white/90 active:bg-white"
                        : "bg-white/15 text-white/40 cursor-not-allowed",
                    ].join(" ")}
                    type="button"
                  >
                    {submitting ? "Submitting..." : "Submit Payment"}
                  </button>
                  <p className="mt-3 text-xs text-white/50 text-center">
                    By submitting, you confirm this payment was made for the selected plan.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center text-white/70 shrink-0">
                    ?
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Where to find UTR?</p>
                    <p className="mt-1 text-xs text-white/60">
                      UPI app → transaction history → open payment → copy UTR/Transaction ID.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}