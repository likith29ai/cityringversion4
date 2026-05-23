"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    id: "",
    title: "",
    subtitle: "",
    price: "199",
    group_limit: "30",
    is_active: true,
    sort_order: "10",
  });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) console.error(error);
    setPlans((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(() => plans.filter((p) => p.is_active).length, [plans]);

  async function save(plan: PlanRow) {
    if (savingId) return;
    setSavingId(plan.id);

    try {
      if (!plan.title.trim()) {
        alert("Title is required");
        return;
      }
      if (!Number.isFinite(plan.price) || plan.price <= 0) {
        alert("Price must be > 0");
        return;
      }
      if (!Number.isFinite(plan.group_limit) || plan.group_limit <= 0) {
        alert("Group limit must be > 0");
        return;
      }
      if (!Number.isFinite(plan.sort_order)) {
        alert("Sort order must be a number");
        return;
      }

      const { error } = await supabase
        .from("membership_plans")
        .update({
          title: plan.title.trim(),
          subtitle: (plan.subtitle ?? "").trim() || null,
          price: plan.price,
          group_limit: plan.group_limit,
          is_active: plan.is_active,
          sort_order: plan.sort_order,
        })
        .eq("id", plan.id);

      if (error) {
        console.error(error);
        alert(`Save failed: ${error.message}`);
        return;
      }

      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function remove(planId: string) {
    if (!confirm("Delete this plan permanently?")) return;
    if (savingId) return;

    setSavingId(planId);
    try {
      const { error } = await supabase.from("membership_plans").delete().eq("id", planId);
      if (error) {
        console.error(error);
        alert(`Delete failed: ${error.message}`);
        return;
      }
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function create() {
    if (savingId) return;

    const id = newPlan.id.trim();
    const title = newPlan.title.trim();
    const subtitle = newPlan.subtitle.trim();
    const price = Number(newPlan.price);
    const group_limit = Number(newPlan.group_limit);
    const sort_order = Number(newPlan.sort_order);

    if (!id) return alert("Plan id is required (example: p199)");
    if (!title) return alert("Title is required");
    if (!Number.isFinite(price) || price <= 0) return alert("Price must be > 0");
    if (!Number.isFinite(group_limit) || group_limit <= 0) return alert("Group limit must be > 0");
    if (!Number.isFinite(sort_order)) return alert("Sort order must be a number");

    setSavingId(id);
    try {
      const { error } = await supabase.from("membership_plans").insert({
        id,
        title,
        subtitle: subtitle || null,
        price,
        group_limit,
        is_active: newPlan.is_active,
        sort_order,
      });

      if (error) {
        console.error(error);
        alert(`Create failed: ${error.message}`);
        return;
      }

      setCreating(false);
      setNewPlan({
        id: "",
        title: "",
        subtitle: "",
        price: "199",
        group_limit: "30",
        is_active: true,
        sort_order: "10",
      });

      await load();
    } finally {
      setSavingId(null);
    }
  }

  function updateLocal(planId: string, patch: Partial<PlanRow>) {
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, ...patch } : p)));
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold">Admin — Plans</h1>
        <p className="mt-2 text-zinc-600">
          Edit plan price, group limits, enable/disable plans, and reorder.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 text-sm"
          >
            Refresh
          </button>

          <button
            onClick={() => setCreating((v) => !v)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            {creating ? "Close" : "Create new plan"}
          </button>

          <div className="text-sm text-zinc-600">
            Active plans: <b>{activeCount}</b> / {plans.length}
          </div>
        </div>

        {creating && (
          <div className="mt-6 bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Create Plan</h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Plan ID (unique)" value={newPlan.id} onChange={(v) => setNewPlan((p) => ({ ...p, id: v }))} placeholder="p199" />
              <Input label="Title" value={newPlan.title} onChange={(v) => setNewPlan((p) => ({ ...p, title: v }))} placeholder="Standard" />
              <Input label="Subtitle" value={newPlan.subtitle} onChange={(v) => setNewPlan((p) => ({ ...p, subtitle: v }))} placeholder="More access" />
              <Input label="Price" value={newPlan.price} onChange={(v) => setNewPlan((p) => ({ ...p, price: v }))} placeholder="199" />
              <Input label="Group limit" value={newPlan.group_limit} onChange={(v) => setNewPlan((p) => ({ ...p, group_limit: v }))} placeholder="30" />
              <Input label="Sort order" value={newPlan.sort_order} onChange={(v) => setNewPlan((p) => ({ ...p, sort_order: v }))} placeholder="10" />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newPlan.is_active}
                  onChange={(e) => setNewPlan((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <span className="text-sm text-zinc-700">Active</span>
              </div>
            </div>

            <button
              onClick={create}
              disabled={!!savingId}
              className="mt-5 px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {savingId ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {loading && <p className="mt-6 text-zinc-500">Loading...</p>}

        {!loading && plans.length === 0 && (
          <p className="mt-6 text-zinc-500">No plans found.</p>
        )}

        <div className="mt-6 space-y-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-zinc-500">ID: <b>{p.id}</b></div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Title"
                      value={p.title}
                      onChange={(v) => updateLocal(p.id, { title: v })}
                      placeholder="Plan title"
                    />
                    <Input
                      label="Subtitle"
                      value={p.subtitle ?? ""}
                      onChange={(v) => updateLocal(p.id, { subtitle: v })}
                      placeholder="Short description"
                    />
                    <Input
                      label="Price"
                      value={String(p.price)}
                      onChange={(v) => updateLocal(p.id, { price: Number(v) })}
                      placeholder="199"
                    />
                    <Input
                      label="Group limit"
                      value={String(p.group_limit)}
                      onChange={(v) => updateLocal(p.id, { group_limit: Number(v) })}
                      placeholder="30"
                    />
                    <Input
                      label="Sort order"
                      value={String(p.sort_order)}
                      onChange={(v) => updateLocal(p.id, { sort_order: Number(v) })}
                      placeholder="1"
                    />

                    <div className="flex items-center gap-2 mt-7">
                      <input
                        type="checkbox"
                        checked={p.is_active}
                        onChange={(e) => updateLocal(p.id, { is_active: e.target.checked })}
                      />
                      <span className="text-sm text-zinc-700">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => save(p)}
                    disabled={savingId === p.id}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingId === p.id ? "Saving..." : "Save"}
                  </button>

                  <button
                    onClick={() => remove(p.id)}
                    disabled={savingId === p.id}
                    className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Tip: disabling a plan hides it from Register/Renew pages (after we update those pages to fetch from DB).
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-zinc-700">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
      />
    </label>
  );
}
