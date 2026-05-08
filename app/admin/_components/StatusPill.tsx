type Status = "pending" | "verified" | "rejected";

const STYLE: Record<Status, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  verified: "border-neon-green/40 bg-neon-green/10 text-neon-green",
  rejected: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function StatusPill({ status }: { status: Status }) {
  const label =
    status === "verified"
      ? "Approved"
      : status[0].toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${STYLE[status]}`}
    >
      {label}
    </span>
  );
}
