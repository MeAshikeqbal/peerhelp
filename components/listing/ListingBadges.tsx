import { Package } from "lucide-react";

const CONDITION_LABEL: Record<string, string> = { new: "New", good: "Good", used: "Used" };
const CONDITION_COLOR: Record<string, string> = {
  new: "bg-neon-green/10 text-neon-green border-neon-green/20",
  good: "bg-blue-900/20 text-blue-400 border-blue-600/20",
  used: "bg-yellow-900/20 text-yellow-400 border-yellow-600/20",
};
const MATERIAL_TYPE_LABELS: Record<string, string> = {
  notes: "Notes",
  handouts: "Handouts",
  pyq: "Past Year Papers",
  other: "Other Material",
};

interface ListingBadgesProps {
  condition: string;
  status: string;
  listingType: string;
  materialType: string | null;
  transactionType?: string;
}

export function ListingBadges({ condition, status, listingType, materialType, transactionType }: ListingBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
          CONDITION_COLOR[condition] ?? "bg-secondary text-muted-foreground border-border"
        }`}
      >
        <Package size={11} />
        {CONDITION_LABEL[condition] ?? condition}
      </span>
      {listingType === "other" && materialType && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/20 text-purple-400 border border-purple-600/20 font-medium">
          {MATERIAL_TYPE_LABELS[materialType] ?? materialType}
        </span>
      )}
      {transactionType === "rental" && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-900/20 text-indigo-400 border border-indigo-600/20 font-medium">
          Rental
        </span>
      )}
      <span
        className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${
          status === "active"
            ? "bg-neon-green/10 text-neon-green border-neon-green/20"
            : "bg-zinc-800 text-zinc-400 border-zinc-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
