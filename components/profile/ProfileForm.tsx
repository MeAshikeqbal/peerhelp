"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Check, Pencil, X } from "lucide-react";

interface ProfileFormProps {
  initialName: string;
  displayName?: string;
}

export function ProfileForm({ initialName, displayName }: ProfileFormProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const shownName = name || displayName || "";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) { setError("Name cannot be empty"); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setSaving(false);
      setError("Session expired. Please log in again.");
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (err) { setError("Failed to save. Please try again."); return; }
    setName(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setError(null);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <div className="flex items-center gap-2 mb-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            autoFocus
            className="bg-deep-teal border-border text-foreground h-9 text-xl font-bold font-display max-w-xs"
          />
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center justify-center h-9 w-9 rounded-md bg-neon-green/10 border border-neon-green/20 text-neon-green hover:bg-neon-green/20 transition-colors disabled:opacity-50"
          >
            <Check size={15} />
          </button>
          <button
            onClick={cancel}
            className="flex items-center justify-center h-9 w-9 rounded-md border border-overlay/[0.08] text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors"
          >
            <X size={15} />
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-2 group mb-1">
          <span className="text-foreground text-xl font-bold font-display">{shownName || "-"}</span>
          <button
            onClick={() => { setDraft(name); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-shade-50 hover:text-foreground"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
