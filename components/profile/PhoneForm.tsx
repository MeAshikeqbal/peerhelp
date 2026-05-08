"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Check, Pencil, X } from "lucide-react";

interface PhoneFormProps {
  initialPhone: string;
}

// Loose client-side validation — mirrors the DB CHECK constraint
const PHONE_RE = /^[0-9+\- ()]{7,15}$/;

export function PhoneForm({ initialPhone }: PhoneFormProps) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [draft, setDraft] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed && !PHONE_RE.test(trimmed)) {
      setError("Enter a valid number (7–15 digits, e.g. +91 98765 43210)");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      setSaving(false);
      setError("Session expired. Please log in again.");
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({ phone_number: trimmed || null })
      .eq("id", user.id);
    setSaving(false);
    if (err) {
      setError("Failed to save. Please try again.");
      return;
    }
    setPhone(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(phone);
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          autoFocus
          type="tel"
          placeholder="+91 98765 43210"
          className="bg-deep-teal border-border text-foreground h-9 text-sm max-w-[200px]"
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
        {error && <p className="w-full text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {phone ? (
        <span className="text-sm text-foreground">{phone}</span>
      ) : (
        <span className="text-sm text-muted-foreground italic">Add phone number</span>
      )}
      <button
        onClick={() => {
          setDraft(phone);
          setEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-shade-50 hover:text-foreground"
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}
