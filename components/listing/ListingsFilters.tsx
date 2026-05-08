"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutGrid,
  Tag,
} from "lucide-react";

interface FilterValues {
  q?: string;
  type?: string;
  condition?: string;
  hostel?: string;
  department?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  college?: string;
  transaction_type?: string;
  page: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-2.5">
      {children}
    </p>
  );
}

function FilterOption({
  active,
  onClick,
  icon,
  label,
  accent = "green",
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  accent?: "green" | "indigo";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
        active
          ? accent === "indigo"
            ? "bg-indigo-500/10 text-indigo-400 font-medium ring-1 ring-indigo-500/20"
            : "bg-neon-green/10 text-neon-green font-medium ring-1 ring-neon-green/20"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {icon && <span className="shrink-0 opacity-60">{icon}</span>}
      <span className="flex-1">{label}</span>
      {active && <CheckCircle2 size={12} className="shrink-0 opacity-80" />}
    </button>
  );
}

export function ListingsFilters({
  filters,
  hideHeader,
  baseUrl = "/dashboard/listings",
  myCollegeName,
}: {
  filters: FilterValues;
  hideHeader?: boolean;
  baseUrl?: string;
  myCollegeName?: string;
}) {
  const router = useRouter();

  function buildUrl(newFilters: Partial<FilterValues>) {
    const merged = { ...filters, ...newFilters, page: 1 };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.type) params.set("type", merged.type);
    if (merged.condition) params.set("condition", merged.condition);
    if (merged.hostel) params.set("hostel", merged.hostel);
    if (merged.department) params.set("department", merged.department);
    if (merged.year) params.set("year", merged.year.toString());
    if (merged.minPrice !== undefined) params.set("minPrice", merged.minPrice.toString());
    if (merged.maxPrice !== undefined) params.set("maxPrice", merged.maxPrice.toString());
    if (merged.college) params.set("college", merged.college);
    if (merged.transaction_type) params.set("transaction_type", merged.transaction_type);
    return `${baseUrl}?${params.toString()}`;
  }

  const hasActiveFilters =
    filters.q || filters.type || filters.condition || filters.hostel ||
    filters.department || filters.year || filters.minPrice !== undefined ||
    filters.maxPrice !== undefined || filters.college || filters.transaction_type;

  return (
    <div className="space-y-5">
      {/* Header — only shown when not embedded in a sheet */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => router.push(baseUrl)}
              className="text-xs text-neon-green hover:underline transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* College */}
      {myCollegeName && (
        <>
          <div>
            <SectionLabel>College</SectionLabel>
            <div className="space-y-1">
              {[
                { value: "", label: "All colleges" },
                { value: "mine", label: "My college only" },
              ].map((opt) => (
                <FilterOption
                  key={opt.value}
                  active={(filters.college ?? "") === opt.value}
                  onClick={() => router.push(buildUrl({ college: opt.value || undefined }))}
                  label={opt.label}
                />
              ))}
            </div>
          </div>
          <hr className="border-border/50" />
        </>
      )}

      {/* Category */}
      <div>
        <SectionLabel>Category</SectionLabel>
        <div className="space-y-1">
          {[
            { value: "", label: "All", icon: <LayoutGrid size={14} /> },
            { value: "book", label: "Books", icon: <BookOpen size={14} /> },
            { value: "other", label: "Notes & Materials", icon: <FileText size={14} /> },
          ].map((opt) => (
            <FilterOption
              key={opt.value}
              active={(filters.type ?? "") === opt.value}
              onClick={() => router.push(buildUrl({ type: opt.value || undefined }))}
              label={opt.label}
              icon={opt.icon}
            />
          ))}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Transaction type */}
      <div>
        <SectionLabel>Listing Type</SectionLabel>
        <div className="space-y-1">
          {[
            { value: "", label: "All", icon: <LayoutGrid size={14} />, accent: "green" as const },
            { value: "sale", label: "For Sale", icon: <Tag size={14} />, accent: "green" as const },
            { value: "rental", label: "For Rent", icon: <CalendarRange size={14} />, accent: "indigo" as const },
          ].map((opt) => (
            <FilterOption
              key={opt.value}
              active={(filters.transaction_type ?? "") === opt.value}
              onClick={() => router.push(buildUrl({ transaction_type: opt.value || undefined }))}
              label={opt.label}
              icon={opt.icon}
              accent={opt.accent}
            />
          ))}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Condition */}
      <div>
        <SectionLabel>Condition</SectionLabel>
        <div className="space-y-1">
          {[
            { value: "", label: "Any condition", dot: null },
            { value: "new", label: "New", dot: "bg-emerald-400" },
            { value: "good", label: "Good", dot: "bg-sky-400" },
            { value: "used", label: "Used", dot: "bg-amber-400" },
          ].map((opt) => {
            const isActive = (filters.condition ?? "") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => router.push(buildUrl({ condition: opt.value || undefined }))}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                  isActive
                    ? "bg-neon-green/10 text-neon-green font-medium ring-1 ring-neon-green/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    opt.dot ? opt.dot : "bg-muted-foreground/30"
                  }`}
                />
                <span className="flex-1">{opt.label}</span>
                {isActive && <CheckCircle2 size={12} className="shrink-0 opacity-80" />}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Year of Study */}
      <div>
        <SectionLabel>Year of Study</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "", label: "All" },
            { value: "1", label: "1st" },
            { value: "2", label: "2nd" },
            { value: "3", label: "3rd" },
            { value: "4", label: "4th" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                router.push(buildUrl({ year: opt.value ? parseInt(opt.value) : undefined }))
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                (filters.year?.toString() ?? "") === opt.value
                  ? "bg-neon-green/10 text-neon-green ring-1 ring-neon-green/20"
                  : "bg-secondary text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Price Range */}
      <div>
        <SectionLabel>Price Range (₹)</SectionLabel>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              placeholder="Min"
              defaultValue={filters.minPrice ?? ""}
              onBlur={(e) =>
                router.push(buildUrl({ minPrice: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full h-9 rounded-md border border-border bg-secondary pl-6 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30"
            />
          </div>
          <span className="text-muted-foreground/60 text-sm shrink-0">–</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={filters.maxPrice ?? ""}
              onBlur={(e) =>
                router.push(buildUrl({ maxPrice: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full h-9 rounded-md border border-border bg-secondary pl-6 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30"
            />
          </div>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Hostel */}
      <div>
        <SectionLabel>Hostel / Block</SectionLabel>
        <div className="relative">
          <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            placeholder="e.g., A1, Cauvery"
            defaultValue={filters.hostel ?? ""}
            onBlur={(e) => router.push(buildUrl({ hostel: e.target.value || undefined }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full h-9 rounded-md border border-border bg-secondary pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30"
          />
        </div>
      </div>
    </div>
  );
}

