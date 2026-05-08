import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle,
  BookOpen,
  FileText,
  CircleDot,
  CheckCircle2,
  Archive,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { getUserListings } from "@/utils/query/listings";

type Listing = {
  id: string;
  title: string;
  condition: string;
  price: number;
  status: string;
  created_at: string;
  image_url: string | null;
  listing_type: string;
  department: string | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  active: {
    label: "Active",
    icon: CircleDot,
    className: "text-neon-green bg-neon-green/10 border-neon-green/20",
  },
  reserved: {
    label: "Reserved",
    icon: LockKeyhole,
    className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  sold: {
    label: "Sold",
    icon: CheckCircle2,
    className: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "text-shade-50 bg-overlay/10 border-overlay/20",
  },
};

const SECTION_ORDER = ["active", "reserved", "sold", "archived"];

function ListingRow({ listing }: { listing: Listing }) {
  const cfg = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.archived;
  const StatusIcon = cfg.icon;

  return (
    <Link
      href={`/dashboard/listings/${listing.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-overlay/[0.03] transition-colors border-b border-overlay/[0.05] last:border-0"
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-overlay/[0.05] border border-overlay/[0.07] flex items-center justify-center">
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : listing.listing_type === "material" ? (
          <FileText size={18} className="text-shade-50" />
        ) : (
          <BookOpen size={18} className="text-shade-50" />
        )}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-neon-green transition-colors">
          {listing.title}
        </p>
        <p className="text-xs text-shade-50 mt-0.5">
          ₹{listing.price.toLocaleString("en-IN")}
          {listing.condition ? ` · ${listing.condition}` : ""}
          {listing.department ? ` · ${listing.department}` : ""}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}
      >
        <StatusIcon size={9} />
        {cfg.label}
      </span>
    </Link>
  );
}

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);
  if (userError || !user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") redirect("/student-verification");

  const { data: listings } = await getUserListings(supabase, user.id);
  const all = (listings ?? []) as Listing[];

  const grouped = SECTION_ORDER.reduce<Record<string, Listing[]>>((acc, status) => {
    acc[status] = all.filter((l) => l.status === status);
    return acc;
  }, {});

  const hasAny = all.length > 0;

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">My Listings</h1>
          <p className="text-muted-foreground">All listings you have created.</p>
        </div>
        <Button asChild size="sm" className="shrink-0 mt-1">
          <Link href="/dashboard/listings/create">
            <PlusCircle size={15} className="mr-1.5" />
            New listing
          </Link>
        </Button>
      </div>

      {!hasAny ? (
        <Empty className="py-20">
          <EmptyMedia>
            <BookOpen size={32} className="text-shade-50" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No listings yet</EmptyTitle>
            <EmptyDescription>
              Create your first listing to start selling books or notes.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href="/dashboard/listings/create">
              <PlusCircle size={15} className="mr-1.5" />
              Create listing
            </Link>
          </Button>
        </Empty>
      ) : (
        <div className="space-y-6">
          {SECTION_ORDER.filter((s) => grouped[s].length > 0).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            const items = grouped[status];

            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <StatusIcon size={12} className={cfg.className.split(" ")[0]} />
                  <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">
                    {cfg.label}
                  </h2>
                  <span className="text-[10px] text-shade-70 font-medium">
                    {items.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
                  {items.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
