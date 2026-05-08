import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditListingForm from "@/components/listing/EditListingForm";
import { getCurrentUser } from "@/utils/query/auth";
import { getListingById } from "@/utils/query/listings";
import { hasBlockingDeal } from "@/utils/query/deals";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: listingData } = await getListingById(supabase, id);

  if (!listingData) notFound();

  // Only the owner can edit
  if (listingData.user_id !== user.id) redirect(`/dashboard/listings/${id}`);

  const listing = listingData as {
    id: string;
    user_id: string;
    title: string;
    condition: string;
    price: number;
    hostel: string | null;
    department: string | null;
    year_of_study: number | null;
    description: string | null;
    subject: string | null;
    listing_type: string;
    material_type: string | null;
    status: string;
    image_url: string | null;
    transaction_type?: string;
    rental_price_type?: string | null;
    security_deposit?: number | null;
  };

  const statusLocked = listing.status === "sold" || listing.status === "reserved";
  const dealLocked = await hasBlockingDeal(supabase, id);
  const isLocked = statusLocked || dealLocked;

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href={`/dashboard/listings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Back to listing
      </Link>

      <EditListingForm listing={listing} isLocked={isLocked} />
    </div>
  );
}
