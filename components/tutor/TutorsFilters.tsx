"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MODES = [
  { value: "", label: "Any mode" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

interface Props {
  subject?: string;
  mode?: string;
  baseUrl?: string;
}

export function TutorsFilters({ subject, mode, baseUrl = "/tutors" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasFilters = subject || mode;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Filters</h2>
        {hasFilters && (
          <Link
            href={baseUrl}
            className="text-xs text-neon-green hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-2.5">
          Mode
        </p>
        <div className="space-y-1">
          {MODES.map((m) => {
            const active = (mode ?? "") === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setParam("mode", m.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-neon-green/10 text-neon-green font-medium ring-1 ring-neon-green/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-2.5">
          Subject
        </p>
        <input
          type="text"
          defaultValue={subject ?? ""}
          placeholder="e.g. Calculus"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setParam("subject", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onBlur={(e) => setParam("subject", e.target.value.trim())}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-neon-green/40"
        />
      </div>
    </div>
  );
}
