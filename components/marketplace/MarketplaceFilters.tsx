"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface FilterValues {
  q?: string;
  condition?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  transaction_type?: string;
  page: number;
}

export function MarketplaceFilters({ filters }: { filters: FilterValues }) {
  const router = useRouter();

  function buildUrl(newFilters: Partial<FilterValues>) {
    const merged = { ...filters, ...newFilters, page: 1 };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.condition) params.set("condition", merged.condition);
    if (merged.year) params.set("year", merged.year.toString());
    if (merged.minPrice !== undefined) params.set("minPrice", merged.minPrice.toString());
    if (merged.maxPrice !== undefined) params.set("maxPrice", merged.maxPrice.toString());
    if (merged.transaction_type) params.set("transaction_type", merged.transaction_type);
    const qs = params.toString();
    return `/marketplace${qs ? `?${qs}` : ""}`;
  }

  const base =
    "h-10 w-full rounded-lg border border-border bg-overlay/[0.02] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-neon-green/40 focus:bg-overlay/[0.04] focus:outline-none transition-all";
  const selectBase = `${base} appearance-none cursor-pointer`;

  return (
    <div className="space-y-4 mb-8 border-b border-border pb-8">
      {/* Sale / Rental tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-forest p-1 w-fit">
        {([["", "All"], ["sale", "For Sale"], ["rental", "For Rent"]] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => router.push(buildUrl({ transaction_type: val || undefined }))}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              (filters.transaction_type ?? "") === val
                ? val === "rental"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-neon-green text-void shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* Search */}
      <div className="col-span-2 sm:col-span-3 lg:col-span-2 relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-shade-60"
        />
        <input
          type="text"
          placeholder="Search books, subjects…"
          defaultValue={filters.q ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              router.push(buildUrl({ q: (e.target as HTMLInputElement).value || undefined }));
          }}
          onBlur={(e) => router.push(buildUrl({ q: e.target.value || undefined }))}
          className={`${base} pl-8`}
        />
      </div>

      {/* Condition */}
      <select
        value={filters.condition ?? ""}
        onChange={(e) => router.push(buildUrl({ condition: e.target.value || undefined }))}
        className={selectBase}
      >
        <option value="">All conditions</option>
        <option value="new">New</option>
        <option value="good">Good</option>
        <option value="used">Used</option>
      </select>

      {/* Year */}
      <select
        value={filters.year ?? ""}
        onChange={(e) =>
          router.push(buildUrl({ year: e.target.value ? parseInt(e.target.value) : undefined }))
        }
        className={selectBase}
      >
        <option value="">All years</option>
        <option value="1">1st year</option>
        <option value="2">2nd year</option>
        <option value="3">3rd year</option>
        <option value="4">4th year</option>
      </select>

      {/* Min price */}
      <input
        type="number"
        placeholder="Min ₹"
        defaultValue={filters.minPrice ?? ""}
        onBlur={(e) =>
          router.push(buildUrl({ minPrice: e.target.value ? parseInt(e.target.value) : undefined }))
        }
        className={base}
      />

      {/* Max price */}
      <input
        type="number"
        placeholder="Max ₹"
        defaultValue={filters.maxPrice ?? ""}
        onBlur={(e) =>
          router.push(buildUrl({ maxPrice: e.target.value ? parseInt(e.target.value) : undefined }))
        }
        className={base}
      />
      </div>
    </div>
  );
}
