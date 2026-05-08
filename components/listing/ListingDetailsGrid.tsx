import { GraduationCap, CalendarDays, Building2, Tag, Banknote } from "lucide-react";

interface ListingDetailsGridProps {
  department: string | null;
  yearOfStudy: number | null;
  hostel: string | null;
  createdAt: string;
  transactionType?: string;
  rentalPriceType?: string | null;
  securityDeposit?: number | null;
}

export function ListingDetailsGrid({ department, yearOfStudy, hostel, createdAt, transactionType, rentalPriceType, securityDeposit }: ListingDetailsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {department && (
        <div className="flex items-start gap-2">
          <GraduationCap size={15} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Department</p>
            <p className="text-sm text-foreground mt-0.5">{department}</p>
          </div>
        </div>
      )}
      {yearOfStudy && (
        <div className="flex items-start gap-2">
          <CalendarDays size={15} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Year</p>
            <p className="text-sm text-foreground mt-0.5">Year {yearOfStudy}</p>
          </div>
        </div>
      )}
      {hostel && (
        <div className="flex items-start gap-2">
          <Building2 size={15} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Hostel</p>
            <p className="text-sm text-foreground mt-0.5">{hostel}</p>
          </div>
        </div>
      )}
      {transactionType === "rental" && rentalPriceType && (
        <div className="flex items-start gap-2">
          <Tag size={15} className="text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pricing</p>
            <p className="text-sm text-foreground mt-0.5">
              {rentalPriceType === "per_day" ? "Per day" : "Flat rate"}
            </p>
          </div>
        </div>
      )}
      {transactionType === "rental" && securityDeposit != null && (
        <div className="flex items-start gap-2">
          <Banknote size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Security Deposit</p>
            <p className="text-sm text-foreground mt-0.5">₹{securityDeposit}</p>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2">
        <CalendarDays size={15} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Listed</p>
          <p className="text-sm text-foreground mt-0.5">
            {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
