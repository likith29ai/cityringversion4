"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { FaInstagram, FaWhatsapp, FaTelegramPlane, FaGlobe } from "react-icons/fa";

type NetworkMode = "instagram" | "whatsapp" | "telegram" | "all";
type Gender = "male" | "female" | "gay" | "lesbian" | "bisexual" | "other";

type Plan = {
  id: string;
  price: number;
  group_limit: number;
  title: string;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function RegisterPage() {
  const [mode, setMode] = useState<NetworkMode>("instagram");
  const [gender, setGender] = useState<Gender | "">("");

  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    instagram: "",
    whatsapp: "",
    telegram: "",
    password: "",
    confirmPassword: "",
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planId, setPlanId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Inline error/info message instead of alerts
  const [message, setMessage] = useState<{
    type: "error" | "info" | "success";
    text: string;
    action?: { label: string; href: string };
  } | null>(null);

  
  useEffect(() => {
    async function loadPlans() {
      setPlansLoading(true);
      const { data, error } = await supabase
        .from("membership_plans")
        .select("id,title,subtitle,price,group_limit,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Failed to load plans:", error);
        setPlans([]);
      } else {
        setPlans((data as any) || []);
      }
      setPlansLoading(false);
    }
    loadPlans();
  }, []);

  // Auto-check email when user finishes typing it
  useEffect(() => {
    if (!form.email || !form.email.includes("@")) return;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", form.email.trim().toLowerCase())
        .maybeSingle();
      if (data) {
        setMessage({
          type: "info",
          text: "This email is already registered.",
          action: { label: "Sign in instead →", href: "/login" },
        });
      } else {
        setMessage(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email]);

  const requiredFields = useMemo(() => {
    if (mode === "instagram") return ["name", "dob", "instagram"] as const;
    if (mode === "whatsapp") return ["name", "dob", "whatsapp"] as const;
    if (mode === "telegram") return ["name", "dob", "telegram"] as const;
    return ["name", "dob", "instagram", "whatsapp", "telegram"] as const;
  }, [mode]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === planId) || null;
  }, [plans, planId]);

  const isValid = useMemo(() => {
    if (!planId || plansLoading) return false;
    if (!form.email || !form.email.trim()) return false;
    if (message?.type === "info") return false; // block if email already exists
    if (!gender) return false; // gender is required
    for (const key of requiredFields) {
      const v = (form as any)[key] as string;
      if (!v || !v.trim()) return false;
    }
    if (!form.password || form.password.length < 6) return false;
    if (form.password !== form.confirmPassword) return false;
    // Enforce exactly 10 digits for whatsapp and telegram
    if ((mode === "whatsapp" || mode === "all") && form.whatsapp.length !== 10) return false;
    if ((mode === "telegram" || mode === "all") && form.telegram.length !== 10) return false;
    return true;
  }, [form, requiredFields, planId, plansLoading, message]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePayNow() {
    if (!isValid || submitting) return;
    if (!selectedPlan) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const cleanEmail = form.email.trim().toLowerCase();

      // Double-check email doesn't exist
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        setMessage({
          type: "info",
          text: "This email is already registered.",
          action: { label: "Sign in to your account →", href: "/login" },
        });
        setSubmitting(false);
        return;
      }

      // Normalize and validate DOB BEFORE creating auth user
      const normalisedDob = form.dob.replace(/\//g, "-");
      
      // Validate DOB format: must be DD-MM-YYYY or YYYY-MM-DD
      const dobRegex = /^(\d{2}-\d{2}-\d{4})|(\d{4}-\d{2}-\d{2})$/;
      if (!dobRegex.test(normalisedDob)) {
        setMessage({ 
          type: "error", 
          text: "Invalid date format. Please use DD-MM-YYYY or DD/MM/YYYY format (e.g., 20-04-2000 or 20/04/2000)" 
        });
        setSubmitting(false);
        return;
      }

      // Additional date validation: check if it's a valid date
      let dobDate: Date;
      if (normalisedDob.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // DD-MM-YYYY format
        const [day, month, year] = normalisedDob.split("-").map(Number);
        dobDate = new Date(year, month - 1, day);
        if (dobDate.getDate() !== day || dobDate.getMonth() !== month - 1 || dobDate.getFullYear() !== year) {
          setMessage({ 
            type: "error", 
            text: "Invalid date. Please check your date of birth." 
          });
          setSubmitting(false);
          return;
        }
      } else {
        // YYYY-MM-DD format
        dobDate = new Date(normalisedDob);
        if (isNaN(dobDate.getTime())) {
          setMessage({ 
            type: "error", 
            text: "Invalid date. Please check your date of birth." 
          });
          setSubmitting(false);
          return;
        }
      }

      // Check if date is not in the future
      if (dobDate > new Date()) {
        setMessage({ 
          type: "error", 
          text: "Date of birth cannot be in the future." 
        });
        setSubmitting(false);
        return;
      }

      // Check if age is reasonable (at least 13 years old)
      const age = Math.floor((new Date().getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 13) {
        setMessage({ 
          type: "error", 
          text: "You must be at least 13 years old to register." 
        });
        setSubmitting(false);
        return;
      }

      // Create Supabase Auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
      });

      if (signUpError) {
        // Supabase returns this when email already exists in auth
        if (
          signUpError.message.toLowerCase().includes("already") ||
          signUpError.message.toLowerCase().includes("registered") ||
          (signUpError as any)?.status === 400
        ) {
          setMessage({
            type: "info",
            text: "This email already has an account.",
            action: { label: "Sign in instead →", href: "/login" },
          });
        } else {
          setMessage({ type: "error", text: `Registration failed: ${signUpError.message}` });
        }
        setSubmitting(false);
        return;
      }

      // Create profile via RPC (normalisedDob already validated and normalized above)
      const rpcPayload: any = {
        _name: form.name.trim(),
        _dob: normalisedDob,
        _email: cleanEmail,
        _network_mode: mode,
        _instagram: mode === "instagram" || mode === "all" ? form.instagram.trim() || null : null,
        _whatsapp: mode === "whatsapp" || mode === "all" ? form.whatsapp.trim() || null : null,
        _telegram: mode === "telegram" || mode === "all" ? form.telegram.trim() || null : null,
        _plan_id: selectedPlan.id,
        _plan_price: selectedPlan.price,
        _password: form.password,
        _gender: gender || null,
      };

      const { data, error } = await supabase.rpc("create_profile_with_password", rpcPayload);

      if (error) {
        // Profile creation failed after auth user was created
        // Show helpful error message
        const errorMessage = error.message.toLowerCase().includes("date") || error.message.toLowerCase().includes("dob")
          ? "Invalid date of birth format. Please use DD-MM-YYYY or DD/MM/YYYY format."
          : `Registration failed: ${error.message}. If you continue to have issues, please contact support.`;
        
        setMessage({ type: "error", text: errorMessage });
        setSubmitting(false);
        return;
      }

      localStorage.setItem("cityring_profile_id", String(data));
      localStorage.setItem(
        "selectedPlan",
        JSON.stringify({
          plan_id: selectedPlan.id,
          plan_price: selectedPlan.price,
          plan_group_limit: selectedPlan.group_limit,
          is_renewal: false,
        })
      );

      const { password, confirmPassword, ...safeForm } = form;
      localStorage.setItem(
        "cityring_register_draft",
        JSON.stringify({
          mode,
          ...safeForm,
          plan_id: selectedPlan.id,
          plan_price: selectedPlan.price,
          plan_group_limit: selectedPlan.group_limit,
        })
      );

      // Sign out immediately — user shouldn't be "logged in" during payment flow.
      // They created an auth account but still need payment approval first.
      await supabase.auth.signOut();

      window.location.href = "/register/payment";
    } catch (e: any) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-[#07070A]">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(255,255,255,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_80%_30%,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.04))]" />
      </div>

       

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-500/80" />
              Membership
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Register</h1>
            <p className="mt-2 text-white/70 max-w-2xl">
              Choose how you want to network, fill your details, then complete payment.
            </p>
          </div>

          {/* Selected plan mini pill */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-5 py-4">
            <p className="text-xs text-white/60">Selected Plan</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {selectedPlan ? selectedPlan.title : "—"}
            </p>
            <p className="mt-1 text-xs text-white/55">
              Fee: <span className="text-white font-semibold">₹{selectedPlan ? selectedPlan.price : "--"}</span>
              {"  "}•{"  "}
              Limit: <span className="text-white font-semibold">{selectedPlan ? selectedPlan.group_limit : "--"}</span>
            </p>
          </div>
        </div>

        {/* Already have account banner */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">Already have an account?</p>
          <a href="/login" className="text-sm font-semibold text-white hover:text-white/80 transition">
            Sign in →
          </a>
        </div>

        {/* Mode Selector */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold tracking-tight">How would you like to network?</h2>
            <p className="mt-2 text-sm text-white/65">
              Pick one mode — this decides which contact fields are required.
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ModeButton active={mode === "instagram"} onClick={() => setMode("instagram")} icon={<FaInstagram />}>
                Instagram
              </ModeButton>
              <ModeButton active={mode === "whatsapp"} onClick={() => setMode("whatsapp")} icon={<FaWhatsapp />}>
                WhatsApp
              </ModeButton>
              <ModeButton active={mode === "telegram"} onClick={() => setMode("telegram")} icon={<FaTelegramPlane />}>
                Telegram
              </ModeButton>
              <ModeButton active={mode === "all"} onClick={() => setMode("all")} icon={<FaGlobe />} recommended>
                All Three
              </ModeButton>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/60">
            Tip: You can change the mode anytime before payment.
          </div>
        </div>

        {/* Plan Selector */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold tracking-tight">Choose a Plan</h2>
            <p className="mt-2 text-sm text-white/65">Pick a membership plan to continue to payment.</p>

            {plansLoading && <p className="mt-4 text-sm text-white/55">Loading plans...</p>}

            {!plansLoading && plans.length === 0 && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                No plans available. Please contact admin.
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((p) => {
                const active = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`text-left rounded-2xl sm:rounded-3xl border p-5 transition ${
                      active
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-white/10 bg-black/35 hover:bg-black/55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold tracking-tight text-white">{p.title}</div>
                        <div className="text-sm text-white/65">{p.subtitle ?? ""}</div>
                        <div className="mt-1 text-xs text-white/55">
                          Join up to <span className="font-semibold text-white">{p.group_limit}</span> groups
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-400/80 font-medium">
                          <span>+</span><span>Gmail included</span>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${active ? "text-blue-200" : "text-white"}`}>
                        ₹{p.price}
                      </div>
                    </div>
                    {active && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-blue-200 font-medium">✓ Selected</div>
                        <div className="text-xs text-white/55">
                          Best for <span className="text-white/80 font-semibold">{p.group_limit}</span> rings
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/60">
            You'll submit payment via UPI on the next screen.
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold tracking-tight">Your Details</h2>
            <p className="mt-2 text-sm text-white/65">
              Fill the required fields, then click <span className="text-white font-semibold">Pay Now</span>.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name *">
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/15"
                  placeholder="Your full name"
                />
              </Field>

              <Field label="DOB (DD/MM/YYYY) *">
                <input
                  value={form.dob}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                    if (value.length > 8) value = value.slice(0, 8);
                    
                    // Auto-format as DD/MM/YYYY
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2);
                    }
                    if (value.length >= 5) {
                      value = value.slice(0, 5) + "/" + value.slice(5);
                    }
                    
                    updateField("dob", value);
                  }}
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/15"
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                />
              </Field>

              {/* Gender selector */}
              <div className="sm:col-span-2">
              <Field label="Gender *">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "male",      label: "Male",      emoji: "♂" },
                      { value: "female",    label: "Female",    emoji: "♀" },
                      { value: "gay",       label: "Gay",       emoji: "🏳️‍🌈" },
                      { value: "lesbian",   label: "Lesbian",   emoji: "🏳️‍🌈" },
                      { value: "bisexual",  label: "Bisexual",  emoji: "💜" },
                      { value: "other",     label: "Other",     emoji: "✦" },
                    ] as { value: Gender; label: string; emoji: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition flex items-center justify-center gap-1.5 outline-none focus:ring-2 focus:ring-white/10 ${
                        gender === opt.value
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                          : "border-white/10 bg-black/35 hover:bg-black/55 text-white/70"
                      }`}
                    >
                      <span className="text-base leading-none">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                {!gender && (
                  <p className="mt-1.5 text-xs text-white/40">Select one to continue</p>
                )}
              </Field>
              </div>

              {/* Email with live duplicate check */}
              <Field label="Email *">
                <input
                  value={form.email}
                  onChange={(e) => {
                    updateField("email", e.target.value);
                    setMessage(null);
                  }}
                  type="email"
                  className={`w-full rounded-2xl border bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 transition ${
                    message?.type === "info" ? "border-yellow-500/50" : "border-white/10 focus:border-white/15"
                  }`}
                  placeholder="you@email.com"
                />
                {/* Inline email message */}
                {message && (
                  <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                    message.type === "info"
                      ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-200"
                      : message.type === "error"
                      ? "bg-red-500/10 border border-red-500/20 text-red-200"
                      : "bg-green-500/10 border border-green-500/20 text-green-200"
                  }`}>
                    <span>{message.text}</span>
                    {message.action && (
                      <a href={message.action.href} className="ml-3 font-semibold underline whitespace-nowrap">
                        {message.action.label}
                      </a>
                    )}
                  </div>
                )}
              </Field>

              {(mode === "instagram" || mode === "all") && (
                <Field label="Instagram Username *">
                  <input
                    value={form.instagram}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/15"
                    placeholder="eg: yourhandle"
                  />
                </Field>
              )}

              {(mode === "whatsapp" || mode === "all") && (
                <Field label="WhatsApp Number *">
                  <div className="flex rounded-2xl border border-white/10 bg-black/35 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-white/15">
                    <span className="flex items-center px-3 text-white/50 text-sm border-r border-white/10 bg-white/5 select-none">+91</span>
                    <input
                      value={form.whatsapp}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        updateField("whatsapp", digits);
                      }}
                      inputMode="numeric"
                      maxLength={10}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/40 outline-none"
                      placeholder="10-digit number"
                    />
                  </div>
                  {form.whatsapp && form.whatsapp.length < 10 && (
                    <p className="mt-1.5 text-xs text-red-400">{10 - form.whatsapp.length} more digit{10 - form.whatsapp.length !== 1 ? "s" : ""} needed</p>
                  )}
                </Field>
              )}

              {(mode === "telegram" || mode === "all") && (
                <Field label="Telegram Number *">
                  <div className="flex rounded-2xl border border-white/10 bg-black/35 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-white/15">
                    <span className="flex items-center px-3 text-white/50 text-sm border-r border-white/10 bg-white/5 select-none">+91</span>
                    <input
                      value={form.telegram}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        updateField("telegram", digits);
                      }}
                      inputMode="numeric"
                      maxLength={10}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/40 outline-none"
                      placeholder="10-digit number"
                    />
                  </div>
                  {form.telegram && form.telegram.length < 10 && (
                    <p className="mt-1.5 text-xs text-red-400">{10 - form.telegram.length} more digit{10 - form.telegram.length !== 1 ? "s" : ""} needed</p>
                  )}
                </Field>
              )}

              <Field label="Create Password *">
                <input
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/15"
                  placeholder="Minimum 6 characters"
                />
              </Field>

              <Field label="Confirm Password *">
                <input
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  type="password"
                  className={`w-full rounded-2xl border bg-black/35 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/50 transition ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-500/50"
                      : "border-white/10 focus:border-white/15"
                  }`}
                  placeholder="Re-enter password"
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">Passwords don't match</p>
                )}
              </Field>
            </div>

            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-white/65">
                Membership fee:{" "}
                <span className="font-semibold text-white">₹{selectedPlan ? selectedPlan.price : "--"}</span>{" "}
                (manual UPI for now)
              </p>
              <button
                onClick={handlePayNow}
                disabled={!isValid || submitting}
                className={[
                  "px-4 sm:px-6 py-3 rounded-2xl font-semibold transition",
                  isValid && !submitting
                    ? "bg-white text-black hover:bg-white/90 shadow-sm"
                    : "bg-white/10 border border-white/10 cursor-not-allowed text-white/60 shadow-none",
                ].join(" ")}
                type="button"
              >
                {submitting ? "Saving..." : "Pay Now"}
              </button>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-4 text-xs text-white/60">
            After payment submission, admin will verify and approve your membership.
          </div>
        </div>

        <p className="mt-6 text-sm text-white/55">
          By continuing, you agree to provide accurate details for verification.
        </p>
      </div>
    </main>
  );
}

function ModeButton({
  active, onClick, children, icon, recommended,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl border px-4 py-3 text-sm font-medium transition flex flex-col items-center justify-center gap-1.5 outline-none focus:ring-2 focus:ring-white/10 ${
        active
          ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
          : recommended
          ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-white/80"
          : "border-white/10 bg-black/35 hover:bg-black/55 text-white/80"
      }`}
      type="button"
    >
      {recommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 whitespace-nowrap tracking-wide">
          ✦ Recommended
        </span>
      )}
      <span className="flex items-center gap-2">
        <span className="text-lg leading-none">{icon}</span>
        <span>{children}</span>
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/80">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}