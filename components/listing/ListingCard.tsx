import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText } from "lucide-react";

export interface ListingCardData {
  id: string;
  title: string;
  condition: string;
  price: number;
  hostel: string;
  department: string;
  year_of_study: number;
  image_url: string | null;
  listing_type: string;
  transaction_type?: string;
  rental_price_type?: string | null;
}

interface ListingCardProps {
  listing: ListingCardData;
  href: string;
  priority?: boolean;
}

export function ListingCard({ listing, href, priority = false }: ListingCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-accent/50 cursor-pointer transition overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-forest flex items-center justify-center border-b border-border">
          {listing.image_url ? (
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-overlay/[0.02]">
              {listing.listing_type === "other" ? (
                <FileText size={28} className="text-muted-foreground/40" />
              ) : (
                <BookOpen size={28} className="text-muted-foreground/40" />
              )}
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 text-lg">{listing.title}</CardTitle>
          <CardDescription>
            {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-display text-2xl font-bold text-accent">
            ₹{listing.price}
            {listing.transaction_type === "rental" && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {listing.rental_price_type === "per_day" ? "/ day" : "flat"}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              {listing.hostel} · {listing.department}
            </div>
            <div>Year {listing.year_of_study}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
