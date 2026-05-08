"use client";

import { useState, useTransition } from "react";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  thread_id: string | null;
  message_id: string | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  reviewed_at: string | null;
  reporter_name: string | null;
  reported_name: string | null;
}

interface ThreadMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function ReportsTable({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[] | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [pending, startTransition] = useTransition();

  async function loadThread(threadId: string | null) {
    if (!threadId) return;
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/admin/reports/${threadId}`);
      const j = await r.json();
      setMessages(j.messages ?? []);
    } finally {
      setLoadingMsgs(false);
    }
  }

  function openReport(report: Report) {
    if (openId === report.id) {
      setOpenId(null);
      setMessages(null);
      return;
    }
    setOpenId(report.id);
    setMessages(null);
    loadThread(report.thread_id);
  }

  async function updateStatus(id: string, status: "reviewed" | "dismissed") {
    startTransition(async () => {
      const r = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (r.ok) {
        setReports((prev) =>
          prev.map((rep) =>
            rep.id === id
              ? { ...rep, status, reviewed_at: new Date().toISOString() }
              : rep,
          ),
        );
      }
    });
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-overlay/10 bg-overlay/[0.02] py-16 text-center">
        <p className="text-base font-medium text-foreground">No reports</p>
        <p className="text-sm text-shade-50">Nothing flagged yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-overlay/10">
      <table className="w-full text-sm">
        <thead className="bg-overlay/5 text-left text-xs uppercase tracking-wide text-shade-50">
          <tr>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Reporter</th>
            <th className="px-4 py-3 font-medium">Reported</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <RowGroup
              key={r.id}
              report={r}
              open={openId === r.id}
              loading={loadingMsgs && openId === r.id}
              messages={openId === r.id ? messages : null}
              onToggle={() => openReport(r)}
              onMark={(s) => updateStatus(r.id, s)}
              busy={pending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowGroup({
  report,
  open,
  loading,
  messages,
  onToggle,
  onMark,
  busy,
}: {
  report: Report;
  open: boolean;
  loading: boolean;
  messages: ThreadMessage[] | null;
  onToggle: () => void;
  onMark: (s: "reviewed" | "dismissed") => void;
  busy: boolean;
}) {
  const statusCls =
    report.status === "pending"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : report.status === "reviewed"
        ? "bg-neon-green/10 text-neon-green border-neon-green/20"
        : "bg-zinc-600/15 text-zinc-400 border-zinc-600/20";

  return (
    <>
      <tr className="border-t border-overlay/10 hover:bg-overlay/5">
        <td className="px-4 py-3 text-shade-50">
          {new Date(report.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </td>
        <td className="px-4 py-3">{report.reporter_name ?? report.reporter_id.slice(0, 8)}</td>
        <td className="px-4 py-3">{report.reported_name ?? report.reported_user_id.slice(0, 8)}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusCls}`}
          >
            {report.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="text-neon-green hover:underline"
          >
            {open ? "Hide" : "Inspect"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-overlay/10 bg-overlay/[0.03]">
          <td colSpan={5} className="px-4 py-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-shade-50">Reason</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{report.reason}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-shade-50">Conversation</p>
                {loading && <p className="mt-1 text-sm text-shade-50">Loading…</p>}
                {!loading && messages && messages.length === 0 && (
                  <p className="mt-1 text-sm text-shade-50">No messages.</p>
                )}
                {!loading && messages && messages.length > 0 && (
                  <ul className="mt-2 space-y-1.5 max-h-80 overflow-y-auto rounded-lg border border-overlay/10 bg-overlay/[0.02] p-3">
                    {messages.map((m) => {
                      const isReported = m.sender_id === report.reported_user_id;
                      const flagged = report.message_id === m.id;
                      return (
                        <li
                          key={m.id}
                          className={`text-sm rounded-md px-2 py-1 ${
                            flagged
                              ? "bg-amber-500/15 border border-amber-500/30"
                              : isReported
                                ? "bg-rose-500/[0.06]"
                                : "bg-overlay/[0.04]"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider text-shade-50 mr-2">
                            {isReported ? "Reported" : "Reporter"} ·{" "}
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                          <span className="whitespace-pre-wrap">{m.body}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {report.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => onMark("reviewed")}
                    className="rounded-md border border-neon-green/40 bg-neon-green/10 px-3 py-1.5 text-xs font-medium text-neon-green hover:bg-neon-green/15 disabled:opacity-50"
                  >
                    Mark reviewed
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onMark("dismissed")}
                    className="rounded-md border border-overlay/15 px-3 py-1.5 text-xs font-medium text-shade-50 hover:text-foreground disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
