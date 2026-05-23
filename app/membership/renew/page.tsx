"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";


type PlanRow = {
  id: string;
  title: string;
  subtitle: string | null;
  price: number;
  group_limit: number;
  is_active: boolean;
  sort_order: number;
};

export default function RenewMembership() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkMode, setNetworkMode] = useState<string>("instagram");

  useEffect(() => {
    // Read which network is being renewed so payment page updates the right subscription
    const mode = localStorage.getItem("cityring_renew_network_mode");
    if (mode) setNetworkMode(mode);

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) console.error(error);
      setPlans((data as any) || []);
      setLoading(false);
    }

    load();
  }, []);

  function selectPlan(plan: PlanRow) {
    localStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        plan_id: plan.id,
        plan_price: plan.price,
        plan_group_limit: plan.group_limit,
        is_renewal: true,
      })
    );

    // Include network mode so payment page updates the correct subscription
    localStorage.setItem(
      "cityring_register_draft",
      JSON.stringify({
        plan_id: plan.id,
        plan_price: plan.price,
        plan_group_limit: plan.group_limit,
        mode: networkMode,
      })
    );

    router.push("/register/payment");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Renew Membership</h1>
        <p className="text-sm text-zinc-600 mb-6">
          Choose a plan and complete payment. Admin will verify and activate it.
        </p>

        {loading && <p className="text-zinc-500">Loading plans...</p>}

        {!loading && plans.length === 0 && (
          <p className="text-zinc-500">No active plans available right now.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan)}
              className="text-left border rounded-2xl p-5 bg-white hover:bg-zinc-50 hover:shadow-sm transition"
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">{plan.title}</div>
                  <div className="text-sm text-zinc-600">{plan.subtitle ?? ""}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Join up to <b>{plan.group_limit}</b> groups
                  </div>
                </div>
                <div className="text-lg font-bold">₹{plan.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}