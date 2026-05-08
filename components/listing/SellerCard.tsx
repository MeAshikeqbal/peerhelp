import Link from "next/link";
import { GraduationCap, Star } from "lucide-react";

function cleanCollegeName(name: string) {
  return name.replace(/\s*\(Id:[^)]*\)/gi, "").trim();
}

interface SellerCardProps {
  sellerId?: string;
  sellerName: string;
  isSeller: boolean;
  avgRating?: number;
  ratingCount?: number;
  collegeName?: string;
}

export function SellerCard({ sellerId, sellerName, isSeller, avgRating, ratingCount, collegeName }: SellerCardProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-overlay/[0.06] border border-border flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-muted-foreground">
          {sellerName[0].toUpperCase()}
        </span>
      </div>
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
