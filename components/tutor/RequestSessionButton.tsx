"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  tutorId: string;
  isLoggedIn: boolean;
  isVerified: boolean;
  isSelf: boolean;
  defaultSubjects: string[];
}

const MODES: { value: "online" | "in_person" | "hybrid"; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

export function RequestSessionButton({
  tutorId,
  isLoggedIn,
  isVerified,
  isSelf,
  defaultSubjects,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(defaultSubjects[0] ?? "");
  const [mode, setMode] = useState<"online" | "in_person" | "hybrid">(
    "online",
  );
  const [proposedWhen, setProposedWhen] = useState("");
  const [message, setMessage] = useState("");

  if (isSelf) {
    return (
      <Button disabled className="w-full h-11" variant="outline">
        This is your tutor profile
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild className="w-full h-11">
        <Link href="/auth/login">Login to request a session</Link>
      </Button>
    );
  }

  if (!isVerified) {
    return (
      <Button asChild className="w-full h-11">
        <Link href="/student-verification">Verify to request a session</Link>
      </Button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tutors/${tutorId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          mode,
          proposed_when: proposedWhen.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "Failed to send request");
        return;
      }
      setOpen(false);
      router.push("/dashboard/tutoring/learning");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-neon-green text-void hover:bg-neon-green/90 font-semibold h-11"
      >
        Request a session
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-border bg-deep-teal p-6 shadow-card-elevated space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Request a tutor session
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                The tutor will review and accept or decline your request.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={60}
                placeholder="e.g. Calculus II"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mode
              </label>
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      mode === m.value
                        ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Proposed time (optional)
              </label>
              <input
                value={proposedWhen}
                onChange={(e) => setProposedWhen(e.target.value)}
                maxLength={120}
                placeholder="e.g. Saturdays 5–7 pm"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Briefly describe what you need help with."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neon-green/40 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !subject.trim()}>
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
