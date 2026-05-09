import Link from "next/link";
import { GraduationCap, Star } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

function cleanCollegeName(name: string) {
  return name.replace(/\s*\(Id:[^)]*\)/gi, "").trim();
}

interface SellerCardProps {
  sellerId?: string;
  sellerName: string;
  sellerAvatarUrl?: string | null;
  isSeller: boolean;
  avgRating?: number;
  ratingCount?: number;
  collegeName?: string;
}

export function SellerCard({ sellerId, sellerName, sellerAvatarUrl, isSeller, avgRating, ratingCount, collegeName }: SellerCardProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <UserAvatar size="sm" src={sellerAvatarUrl} name={sellerName} />
      <div>
        <p className="text-sm font-medium text-foreground group-hover:text-neon-green transition-colors">{sellerName}</p>
        {collegeName && (
          <div className="flex items-center gap-1 mt-0.5">
            <GraduationCap size={10} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground leading-tight">{cleanCollegeName(collegeName)}</span>
          </div>
        )}
        {ratingCount && ratingCount > 0 ? (
          <div className="mt-0.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => {
                const filled = avgRating !== undefined && i < Math.round(avgRating);
                return (
                  <Star
                    key={i}
                    size={10}
                    className={filled ? "fill-neon-green text-neon-green" : "fill-none text-muted-foreground/40"}
                  />
                );
              })}
              <span className="ml-1 text-xs text-muted-foreground">
                {avgRating?.toFixed(1)} ({ratingCount})
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{isSeller ? "Your listing" : "Seller"}</p>
        )}
      </div>
    </div>
  );

  if (!isSeller && sellerId) {
    return (
      <Link href={`/dashboard/profile/${sellerId}`} className="group">
        {inner}
      </Link>
    );
  }
  return inner;
}
