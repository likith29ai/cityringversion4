"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Platform = "instagram" | "gmail" | "whatsapp" | "telegram";

export default function AdminExclusiveNewPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    interest: "",
    price: "",
    posterUrl: "",
  });

  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({
    instagram: true,
    gmail: false,
    whatsapp: false,
    telegram: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ── Poster upload state ──────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  const selectedPlatforms = useMemo(() => {
    return (Object.keys(platforms) as Platform[]).filter((k) => platforms[k]);
  }, [platforms]);

  const canSubmit = useMemo(() => {
    const p = Number(form.price);
    return (
      form.title.trim().length > 2 &&
      form.description.trim().length > 2 &&
      form.city.trim().length > 1 &&
      form.interest.trim().length > 1 &&
      Number.isFinite(p) &&
      p > 0 &&
      selectedPlatforms.length > 0 &&
      !submitting &&
      !uploading
    );
  }, [form, selectedPlatforms, submitting, uploading]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Handle file selection ────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPosterPreview(reader.result as string);
    reader.readAsDataURL(file);

    setPosterFile(file);
    // Clear any manually typed URL so we know we're using the upload
    updateField("posterUrl", "");
  }

  // ── Upload to Supabase Storage ───────────────────────────────────────────
  async function uploadPoster(): Promise<string | null> {
    if (!posterFile) return form.posterUrl.trim() || null;

    setUploading(true);
    try {
      const ext = posterFile.name.split(".").pop();
      const fileName = `exclusive-posters/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("posters") // ← your Supabase Storage bucket name
        .upload(fileName, posterFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("posters").getPublicUrl(fileName);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  function removePoster() {
    setPosterFile(null);
    setPosterPreview(null);
    updateField("posterUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  // ─────────────────────────────────────────────────────────────────────────

  async function createExclusiveGroup() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMsg(null);

    try {
      const resolvedPosterUrl = await uploadPoster();

      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city.trim(),
        interest: form.interest.trim(),
        price: Number(form.price),
        platforms: selectedPlatforms,
        poster_url: resolvedPosterUrl,
        is_active: true,
      };

      const { error } = await supabase.from("exclusive_groups").insert(payload);
      if (error) throw error;

      setMsg("✅ Exclusive group created.");
      setForm({ title: "", description: "", city: "", interest: "", price: "", posterUrl: "" });
      setPlatforms({ instagram: true, gmail: false, whatsapp: false, telegram: false });
      setPosterFile(null);
      setPosterPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      console.error(e);
      setMsg(`❌ Failed: ${e.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34, fontWeight: 700 }}>New Exclusive Group</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        Create a premium group with a custom price. Payment will be done personally after approval.
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        <Field label="Title *">
          <input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            style={inputStyle}
            placeholder="Group title"
          />
        </Field>

        <Field label="Description *">
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            style={{ ...inputStyle, minHeight: 100 }}
            placeholder="Write a short description"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Interest *">
            <input
              value={form.interest}
              onChange={(e) => updateField("interest", e.target.value)}
              style={inputStyle}
              placeholder="eg: Cricket"
            />
          </Field>

          <Field label="City *">
            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              style={inputStyle}
              placeholder="eg: Hyderabad"
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Price (₹) *">
            <input
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              style={inputStyle}
              placeholder="eg: 999"
              inputMode="numeric"
            />
          </Field>

          {/* ── Poster Upload Field ───────────────────────────────────────── */}
          <Field label="Poster Image (optional)">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {posterPreview ? (
              /* Preview card once a file is chosen */
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f9fafb",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                    {posterFile?.name}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={smallBtnStyle("#2563eb")}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removePoster}
                      style={smallBtnStyle("#dc2626")}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Upload zone when no file selected */
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #d1d5db",
                    borderRadius: 14,
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "#f9fafb",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>
                    Click to upload poster
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                    PNG, JPG, WEBP — max 5 MB
                  </div>
                </div>

                {/* OR: manual URL fallback */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 6px" }}>
                  <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb" }} />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>or paste URL</span>
                  <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e5e7eb" }} />
                </div>
                <input
                  value={form.posterUrl}
                  onChange={(e) => updateField("posterUrl", e.target.value)}
                  style={{ ...inputStyle, fontSize: 13 }}
                  placeholder="https://..."
                />
              </div>
            )}
          </Field>
          {/* ─────────────────────────────────────────────────────────────── */}
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Platforms *</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {platformOption("Instagram", "instagram", platforms, setPlatforms)}
            {platformOption("Gmail", "gmail", platforms, setPlatforms)}
            {platformOption("WhatsApp", "whatsapp", platforms, setPlatforms)}
            {platformOption("Telegram", "telegram", platforms, setPlatforms)}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Select what users should be asked when they click <b>Apply Now</b>.
          </div>
        </div>

        {msg && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: msg.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
            }}
          >
            {msg}
          </div>
        )}

        <button
          onClick={createExclusiveGroup}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: canSubmit ? "#111827" : "#9ca3af",
            color: "white",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
          type="button"
        >
          {uploading ? "Uploading poster…" : submitting ? "Creating..." : "Create Exclusive Group"}
        </button>

        <div style={{ fontSize: 14 }}>
          <a href="/admin/exclusive" style={{ color: "#2563eb", textDecoration: "underline" }}>
            ← Back to Exclusive Groups
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function smallBtnStyle(bg: string): React.CSSProperties {
  return {
    padding: "4px 10px",
    borderRadius: 8,
    border: "none",
    background: bg,
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function platformOption(
  label: string,
  key: Platform,
  platforms: Record<Platform, boolean>,
  setPlatforms: React.Dispatch<React.SetStateAction<Record<Platform, boolean>>>
) {
  const checked = platforms[key];
  return (
    <label
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: checked ? "#eff6ff" : "white",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setPlatforms((p) => ({ ...p, [key]: e.target.checked }))}
      />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  outline: "none",
};