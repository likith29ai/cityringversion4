"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Group = {
  id: string;
  title: string;
  city: string;
  interest: string;
  is_active?: boolean | null;
};

type Section = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
};

type SectionItem = {
  id: string;
  section_id: string;
  group_id: string;
  sort_order: number;
  group?: Group | null;
};

export default function AdminHomepagePage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [itemsBySection, setItemsBySection] = useState<Record<string, SectionItem[]>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New section form
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const { data: sec, error: secErr } = await supabase
        .from("homepage_sections")
        .select("id,slug,title,subtitle,sort_order,is_active")
        .order("sort_order", { ascending: true });
      if (secErr) throw secErr;

      const { data: it, error: itErr } = await supabase
        .from("homepage_section_items")
        .select("id,section_id,group_id,sort_order, group:groups(id,title,city,interest,is_active)")
        .order("sort_order", { ascending: true });
      if (itErr) throw itErr;

      const { data: g, error: gErr } = await supabase
        .from("groups")
        .select("id,title,city,interest,is_active")
        .order("created_at", { ascending: false });
      if (gErr) throw gErr;

      const secArr = (sec ?? []) as Section[];
      const itemsArr = (it ?? []) as unknown as SectionItem[];
      const groupsArr = (g ?? []) as Group[];

      const map: Record<string, SectionItem[]> = {};
      for (const s of secArr) map[s.id] = [];
      for (const row of itemsArr) {
        const item: SectionItem = {
          id: row.id,
          section_id: row.section_id,
          group_id: row.group_id,
          sort_order: row.sort_order,
          group: (row as any).group ?? null,
        };
        if (!map[item.section_id]) map[item.section_id] = [];
        map[item.section_id].push(item);
      }
      for (const k of Object.keys(map)) {
        map[k].sort((a, b) => a.sort_order - b.sort_order);
      }

      setSections(secArr);
      setItemsBySection(map);
      setGroups(groupsArr);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(); }, []);

  async function createSection() {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      // slug = lowercase title, spaces → hyphens, strip special chars
      const slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
      const nextOrder = sections.length ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0;

      const { data, error: insErr } = await supabase
        .from("homepage_sections")
        .insert({
          slug,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || null,
          sort_order: nextOrder,
          is_active: true,
        })
        .select("id,slug,title,subtitle,sort_order,is_active")
        .single();

      if (insErr) throw insErr;

      const newSec = data as Section;
      setSections(prev => [...prev, newSec].sort((a, b) => a.sort_order - b.sort_order));
      setItemsBySection(prev => ({ ...prev, [newSec.id]: [] }));
      setNewTitle("");
      setNewSubtitle("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create section");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSection(sectionId: string) {
    setDeleting(true);
    setError(null);
    try {
      // items cascade delete automatically (ON DELETE CASCADE in schema)
      const { error: delErr } = await supabase
        .from("homepage_sections")
        .delete()
        .eq("id", sectionId);
      if (delErr) throw delErr;

      setSections(prev => prev.filter(s => s.id !== sectionId));
      setItemsBySection(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
      setConfirmDeleteId(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete section");
    } finally {
      setDeleting(false);
    }
  }

  async function addGroupToSection(sectionId: string, groupId: string) {
    setError(null);
    const current = itemsBySection[sectionId] ?? [];
    const nextOrder = current.length ? Math.max(...current.map(x => x.sort_order)) + 1 : 0;
    const { data, error: insErr } = await supabase
      .from("homepage_section_items")
      .insert({ section_id: sectionId, group_id: groupId, sort_order: nextOrder })
      .select("id,section_id,group_id,sort_order")
      .single();
    if (insErr) { setError(insErr.message); return; }
    const newItem: SectionItem = { ...(data as any), group: groups.find(g => g.id === groupId) ?? null };
    setItemsBySection(prev => {
      const next = { ...prev };
      next[sectionId] = [...(next[sectionId] ?? []), newItem].sort((a, b) => a.sort_order - b.sort_order);
      return next;
    });
  }

  async function removeItem(itemId: string, sectionId: string) {
    setError(null);
    const { error: delErr } = await supabase.from("homepage_section_items").delete().eq("id", itemId);
    if (delErr) { setError(delErr.message); return; }
    setItemsBySection(prev => {
      const next = { ...prev };
      next[sectionId] = (next[sectionId] ?? []).filter(x => x.id !== itemId);
      return next;
    });
  }

  async function moveItem(sectionId: string, index: number, dir: "up" | "down") {
    setError(null);
    const list = [...(itemsBySection[sectionId] ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    const aOrder = a.sort_order;
    const bOrder = b.sort_order;
    a.sort_order = bOrder;
    b.sort_order = aOrder;
    list.sort((x, y) => x.sort_order - y.sort_order);
    setItemsBySection(prev => ({ ...prev, [sectionId]: list }));
    const { error: rpcErr } = await supabase.rpc("swap_homepage_item_positions", { p_item_a: a.id, p_item_b: b.id });
    if (!rpcErr) return;
    await supabase.from("homepage_section_items").update({ sort_order: bOrder }).eq("id", a.id);
    await supabase.from("homepage_section_items").update({ sort_order: aOrder }).eq("id", b.id);
  }

  if (loading) return <div className="p-6 text-zinc-500">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Homepage Sections</h1>
        <p className="mt-1 text-sm text-zinc-500">Create sections with custom headings, add rings to each, delete when done.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── CREATE NEW SECTION ── */}
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">+ Create New Section</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Heading — e.g. New Rings of Bangalore"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            onKeyDown={e => e.key === "Enter" && createSection()}
          />
          <input
            value={newSubtitle}
            onChange={e => setNewSubtitle(e.target.value)}
            placeholder="Subtitle (optional)"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            onKeyDown={e => e.key === "Enter" && createSection()}
          />
          <button
            onClick={createSection}
            disabled={!newTitle.trim() || creating}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
          >
            {creating ? "Creating…" : "Create Section"}
          </button>
        </div>
      </div>

      {sections.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-400">
          No sections yet. Create your first one above.
        </div>
      )}

      {/* ── SECTIONS ── */}
      <div className="space-y-5">
        {sections.map(s => {
          const items = (itemsBySection[s.id] ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
          const alreadyAdded = new Set(items.map(i => i.group_id));

          return (
            <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-100 bg-zinc-50">
                <div>
                  <div className="text-base font-bold text-zinc-900">{s.title}</div>
                  {s.subtitle && <div className="text-sm text-zinc-500 mt-0.5">{s.subtitle}</div>}
                  <div className="text-xs text-zinc-400 mt-1">{items.length} ring{items.length !== 1 ? "s" : ""}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Add ring dropdown */}
                  <select
                    defaultValue=""
                    onChange={e => {
                      const gid = e.target.value;
                      if (!gid) return;
                      void addGroupToSection(s.id, gid);
                      e.currentTarget.value = "";
                    }}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="" disabled>+ Add ring…</option>
                    {groups
                      .filter(g => !alreadyAdded.has(g.id))
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title} — {g.city}
                        </option>
                      ))}
                  </select>

                  {/* Delete section */}
                  {confirmDeleteId === s.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteSection(s.id)}
                        disabled={deleting}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        {deleting ? "Deleting…" : "Yes, Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-2 rounded-lg border border-zinc-300 text-xs text-zinc-600 hover:bg-zinc-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition"
                    >
                      Delete Section
                    </button>
                  )}
                </div>
              </div>

              {/* Rings list */}
              <div className="p-4 space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">No rings added yet. Use the dropdown above.</p>
                ) : (
                  items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-800">{it.group?.title ?? it.group_id}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {it.group ? `${it.group.city} • ${it.group.interest}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void moveItem(s.id, idx, "up")}
                          disabled={idx === 0}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 text-xs hover:bg-zinc-100 disabled:opacity-30 transition"
                        >↑</button>
                        <button
                          onClick={() => void moveItem(s.id, idx, "down")}
                          disabled={idx === items.length - 1}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 text-xs hover:bg-zinc-100 disabled:opacity-30 transition"
                        >↓</button>
                        <button
                          onClick={() => void removeItem(it.id, s.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs hover:bg-red-50 transition"
                        >Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}