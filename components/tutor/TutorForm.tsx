"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MODES = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const STATUSES = [
  { value: "active", label: "Active", description: "Visible to learners" },
  { value: "paused", label: "Paused", description: "Hidden, can resume" },
  { value: "archived", label: "Archived", description: "Hidden, retire profile" },
] as const;

export interface TutorFormDefaults {
  id?: string;
  headline?: string;
  bio?: string | null;
  subjects?: string[];
  mode?: string;
  hourly_rate?: number;
  availability?: string | null;
  languages?: string[] | null;
  experience?: string | null;
  status?: string;
}

interface Props {
  mode: "create" | "edit";
  initial?: TutorFormDefaults;
}

const HEADLINE_MAX = 120;
const BIO_MAX = 2000;
const AVAILABILITY_MAX = 200;
const EXPERIENCE_MAX = 500;
const SUBJECT_MAX = 8;
const LANGUAGE_MAX = 6;

export function TutorForm({ mode, initial }: Props) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
  const [subjectInput, setSubjectInput] = useState("");
  const [tutorMode, setTutorMode] = useState(initial?.mode ?? "online");
  const [hourlyRate, setHourlyRate] = useState(
    initial?.hourly_rate?.toString() ?? "",
  );
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [languages, setLanguages] = useState<string[]>(
    initial?.languages ?? [],
  );
  const [languageInput, setLanguageInput] = useState("");
  const [experience, setExperience] = useState(initial?.experience ?? "");
  const [status, setStatus] = useState<"active" | "paused" | "archived">(
    (initial?.status as "active" | "paused" | "archived") ?? "active",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag(
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    setInput: (v: string) => void,
    max: number,
    itemMax: number,
  ) {
    const t = value.trim();
    if (!t) return;
    if (t.length > itemMax) return;
    if (list.length >= max) return;
    if (list.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setInput("");
      return;
    }
    setList([...list, t]);
    setInput("");
  }

  function tagKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    setInput: (v: string) => void,
    max: number,
    itemMax: number,
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(list, setList, value, setInput, max, itemMax);
    } else if (e.key === "Backspace" && !value && list.length) {
      setList(list.slice(0, -1));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!headline.trim()) {
      setError("Headline is required");
      return;
    }
    if (subjects.length === 0) {
      setError("Add at least one subject");
      return;
    }
    const rateInt = parseInt(hourlyRate, 10);
    if (Number.isNaN(rateInt) || rateInt < 0) {
      setError("Hourly rate must be a non-negative number");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        headline: headline.trim(),
        bio: bio.trim() || null,
        subjects,
        mode: tutorMode,
        hourly_rate: rateInt,
        availability: availability.trim() || null,
        languages: languages.length ? languages : null,
        experience: experience.trim() || null,
      };
      if (mode === "edit") payload.status = status;

      if (mode === "edit" && !initial?.id) {
        setError("Missing tutor profile ID");
        return;
      }
      const url =
        mode === "create" ? "/api/tutors/create" : `/api/tutors/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        tutor?: { id: string };
      };

      if (!res.ok) {
        setError(data.message ?? "Failed to save");
        return;
      }

      router.push("/dashboard/tutoring");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Field label="Headline" hint={`${headline.length}/${HEADLINE_MAX}`}>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={HEADLINE_MAX}
          placeholder="e.g. CS senior offering Calculus & DSA help"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40"
        />
      </Field>

      <Field label="Subjects" hint={`${subjects.length}/${SUBJECT_MAX}`}>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background px-2 py-2 focus-within:ring-1 focus-within:ring-neon-green/40">
          {subjects.map((s) => (
            <Tag key={s} onRemove={() => setSubjects(subjects.filter((x) => x !== s))}>
              {s}
            </Tag>
          ))}
          {subjects.length < SUBJECT_MAX && (
            <input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) =>
                tagKeyDown(
                  e,
                  subjects,
                  setSubjects,
                  subjectInput,
                  setSubjectInput,
                  SUBJECT_MAX,
                  60,
                )
              }
              onBlur={() =>
                addTag(
                  subjects,
                  setSubjects,
                  subjectInput,
                  setSubjectInput,
                  SUBJECT_MAX,
                  60,
                )
              }
              placeholder="Add subject and press Enter"
              maxLength={60}
              className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
          )}
        </div>
      </Field>

      <Field label="Mode">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setTutorMode(m.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tutorMode === m.value
                  ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Hourly rate (₹)">
        <input
          type="number"
          min={0}
          max={1_000_000}
          step={50}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          required
          placeholder="500"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40"
        />
      </Field>

      <Field
        label="Availability (optional)"
        hint={`${availability.length}/${AVAILABILITY_MAX}`}
      >
        <input
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          maxLength={AVAILABILITY_MAX}
          placeholder="e.g. Weeknights 6–9 pm, weekends afternoons"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40"
        />
      </Field>

      <Field
        label="Languages (optional)"
        hint={`${languages.length}/${LANGUAGE_MAX}`}
      >
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background px-2 py-2 focus-within:ring-1 focus-within:ring-neon-green/40">
          {languages.map((l) => (
            <Tag
              key={l}
              onRemove={() => setLanguages(languages.filter((x) => x !== l))}
            >
              {l}
            </Tag>
          ))}
          {languages.length < LANGUAGE_MAX && (
            <input
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              onKeyDown={(e) =>
                tagKeyDown(
                  e,
                  languages,
                  setLanguages,
                  languageInput,
                  setLanguageInput,
                  LANGUAGE_MAX,
                  40,
                )
              }
              onBlur={() =>
                addTag(
                  languages,
                  setLanguages,
                  languageInput,
                  setLanguageInput,
                  LANGUAGE_MAX,
                  40,
                )
              }
              placeholder="English, Hindi…"
              maxLength={40}
              className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
          )}
        </div>
      </Field>

      <Field
        label="Experience (optional)"
        hint={`${experience.length}/${EXPERIENCE_MAX}`}
      >
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          maxLength={EXPERIENCE_MAX}
          rows={3}
          placeholder="TA for CS101, helped 12 peers prep for finals…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40 resize-none"
        />
      </Field>

      <Field label="About (optional)" hint={`${bio.length}/${BIO_MAX}`}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={5}
          placeholder="Tell learners about your teaching style…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40 resize-none"
        />
      </Field>

      {mode === "edit" && (
        <Field label="Profile status">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  status === s.value
                    ? "border-neon-green/50 bg-neon-green/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    status === s.value ? "text-neon-green" : "text-foreground"
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/tutoring")}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Create profile"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-muted-foreground/60">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Tag({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neon-green/10 border border-neon-green/30 px-2.5 py-1 text-xs text-neon-green">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-70 hover:opacity-100"
        aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}
