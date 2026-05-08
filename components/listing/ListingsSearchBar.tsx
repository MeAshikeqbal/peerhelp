"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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

export function ListingsSearchBar({ filters, baseUrl = "/dashboard/listings" }: { filters: FilterValues; baseUrl?: string }) {
  const router = useRouter();

  function buildUrl(q: string | undefined) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filters.type) params.set("type", filters.type);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.hostel) params.set("hostel", filters.hostel);
    if (filters.department) params.set("department", filters.department);
    if (filters.year) params.set("year", filters.year.toString());
    if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.college) params.set("college", filters.college);
    if (filters.transaction_type) params.set("transaction_type", filters.transaction_type);
    return `${baseUrl}?${params.toString()}`;
  }

  return (
    <div className="relative mb-6">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Search listings..."
        defaultValue={filters.q ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            router.push(buildUrl((e.target as HTMLInputElement).value || undefined));
          }
        }}
        onBlur={(e) => router.push(buildUrl(e.target.value || undefined))}
        className="w-full h-11 rounded-lg border border-border bg-secondary pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30"
      />
    </div>
  );
}
