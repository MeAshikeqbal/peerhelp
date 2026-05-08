"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Role = "tutor" | "learner";
type Status =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

interface Action {
  status: Status;
  label: string;
  variant?: "default" | "outline" | "destructive";
}

const ALLOWED: Record<Status, Record<Role, Action[]>> = {
  pending: {
    tutor: [
      { status: "accepted", label: "Accept" },
      { status: "declined", label: "Decline", variant: "outline" },
    ],
    learner: [
      { status: "cancelled", label: "Cancel request", variant: "outline" },
    ],
  },
  accepted: {
    tutor: [
      { status: "completed", label: "Mark completed" },
      { status: "cancelled", label: "Cancel", variant: "outline" },
    ],
    learner: [
      { status: "completed", label: "Mark completed" },
      { status: "cancelled", label: "Cancel", variant: "outline" },
    ],
  },
  declined: { tutor: [], learner: [] },
  cancelled: { tutor: [], learner: [] },
  completed: { tutor: [], learner: [] },
};

interface Props {
  requestId: string;
  role: Role;
  status: Status;
}

export function SessionRequestStatusActions({
  requestId,
  role,
  status,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = ALLOWED[status]?.[role] ?? [];
  if (actions.length === 0) return null;

  async function act(next: Status) {
    setSubmitting(next);
    setError(null);
    try {
      const res = await fetch(`/api/tutors/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "Failed to update");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.status}
            size="sm"
            variant={a.variant ?? "default"}
            disabled={submitting !== null}
            onClick={() => act(a.status)}
          >
            {submitting === a.status ? "…" : a.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
