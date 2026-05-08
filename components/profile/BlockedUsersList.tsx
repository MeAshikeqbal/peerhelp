"use client";

import { useEffect, useState } from "react";
import { Ban, RotateCw } from "lucide-react";

interface BlockedRow {
  blocked_id: string;
  reason: string | null;
  created_at: string;
  full_name: string | null;
}

export function BlockedUsersList() {
  const [rows, setRows] = useState<BlockedRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/users/blocked");
      const j = await r.json();
      setRows(j.blocked ?? []);
    } catch {
      setError("Failed to load blocked users");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function unblock(userId: string) {
    setBusy(userId);
    try {
      const r = await fetch(`/api/users/${userId}/block`, { method: "DELETE" });
      if (r.ok) {
        setRows((prev) => prev?.filter((x) => x.blocked_id !== userId) ?? null);
      }
    } finally {
      setBusy(null);
    }
  }

  if (rows === null) {
    return <p className="px-6 py-4 text-xs text-shade-50">Loading…</p>;
  }
  if (error) {
    return <p className="px-6 py-4 text-xs text-red-400">{error}</p>;
  }
  if (rows.length === 0) {
    return (
      <div className="px-6 py-6 text-center">
        <Ban className="mx-auto mb-2 h-5 w-5 text-shade-50/40" strokeWidth={1.5} />
        <p className="text-xs text-shade-50">You haven&apos;t blocked anyone.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-overlay/[0.05]">
      {rows.map((r) => (
        <li key={r.blocked_id} className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="min-w-0">
            <p className="text-sm text-foreground truncate">
              {r.full_name ?? r.blocked_id.slice(0, 8)}
            </p>
            {r.reason && (
              <p className="text-xs text-shade-50 mt-0.5 truncate">{r.reason}</p>
            )}
          </div>
          <button
            type="button"
            disabled={busy === r.blocked_id}
            onClick={() => unblock(r.blocked_id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-overlay/15 px-2.5 py-1 text-xs text-shade-30 hover:text-foreground disabled:opacity-50"
          >
            <RotateCw size={11} />
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}
