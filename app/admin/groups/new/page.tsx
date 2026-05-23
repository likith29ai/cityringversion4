"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Msg =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function NewGroupPage() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");

  // REQUIRED by DB (NOT NULL)
  const [interest, setInterest] = useState("");
  const [description, setDescription] = useState("");

  // Optional poster: either URL or file upload
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Platforms (admin must specify which platform(s) this group supports)
  const PLATFORM_OPTIONS = [
    { key: "instagram", label: "Instagram" },
    { key: "gmail", label: "Gmail" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "telegram", label: "Telegram" },
  ] as const;
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!city.trim()) return false;
    if (!interest.trim()) return false;
    if (!description.trim()) return false;
    if (!platforms.length) return false;
    return true;
  }, [title, city, interest, description, platforms]);

  function togglePlatform(key: string) {
    setPlatforms((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((p) => p !== key);
      return [...prev, key];
    });
  }

  async function uploadPosterIfNeeded(): Promise<string | null> {
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const safeTitle = slugify(title) || "group";
      const name = `${Date.now()}-${safeTitle}.${ext}`;
      const path = `posters/${name}`;

      const uploadRes = await supabase.storage
        .from("group-posters")
        .upload(path, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type || undefined,
        });

      if (uploadRes.error) {
        throw new Error(`Storage upload failed: ${uploadRes.error.message}`);
      }

      const pub = supabase.storage.from("group-posters").getPublicUrl(path);
      const publicUrl = pub.data.publicUrl;

      if (!publicUrl) throw new Error("Upload succeeded but public URL was empty.");

      return publicUrl;
    }

    const url = imageUrl.trim();
    return url ? url : null;
  }

  async function createGroup() {
    if (!canSubmit || busy) return;

    setBusy(true);
    setMsg(null);

    try {
      const poster_url = await uploadPosterIfNeeded();

      // Insert payload must include required columns
      const payload: any = {
        title: title.trim(),
        city: city.trim(),
        interest: interest.trim(),
        description: description.trim(),
        platforms,
      };
      if (poster_url) payload.poster_url = poster_url;

      const { error } = await supabase.from("groups").insert(payload);

      if (error) throw new Error(`DB insert failed: ${error.message}`);

      setMsg({ type: "success", text: "✅ Group created successfully!" });

      // reset
      setTitle("");
      setCity("");
      setInterest("");
      setDescription("");
      setPlatforms(["instagram"]);
      setImageUrl("");
      setFile(null);
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message || "Failed to create group." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Create Group
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Add a new group with title, city, interest, description, and optional poster.
      </p>

      {msg && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
            border: "1px solid",
            borderColor: msg.type === "success" ? "#16a34a" : "#ef4444",
            background: msg.type === "success" ? "#dcfce7" : "#fee2e2",
            color: "#111827",
          }}
        >
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Title *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CityRing Hyderabad"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>City *</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Hyderabad"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Interest *</span>
          <input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. Startups / Fitness / Coding"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Description *</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this group is about..."
            rows={4}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Required because <b>groups.description</b> is NOT NULL.
          </span>
        </label>

        <div
          style={{
            padding: 14,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fafafa",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Platforms *</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {PLATFORM_OPTIONS.map((p) => (
              <label
                key={p.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: platforms.includes(p.key) ? "#eff6ff" : "white",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={platforms.includes(p.key)}
                  onChange={() => togglePlatform(p.key)}
                />
                <span style={{ fontWeight: 600 }}>{p.label}</span>
              </label>
            ))}
          </div>
          <span style={{ fontSize: 12, opacity: 0.7, display: "block", marginTop: 8 }}>
            Select what users should be asked when they click <b>Join Now</b>.
          </span>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fafafa",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Poster (optional)</div>

          <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>Image URL (optional)</span>
            <input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value.trim()) setFile(null);
              }}
              placeholder="https://..."
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Upload Image File (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) setImageUrl("");
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Uploads to <b>group-posters</b> and saves to <b>groups.poster_url</b>
            </span>
          </label>
        </div>

        <button
          onClick={createGroup}
          disabled={!canSubmit || busy}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #111827",
            background: busy ? "#9ca3af" : "#111827",
            color: "white",
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}
