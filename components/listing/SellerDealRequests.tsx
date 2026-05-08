import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealActions } from "@/components/deals/DealActions";
import { ContactReveal } from "@/components/deals/ContactReveal";

interface DealRow {
  id: string;
  status: string;
  buyer_id: string;
  created_at: string;
  proposed_days?: number | null;
  proposed_start_date?: string | null;
}

interface SellerDealRequestsProps {
  sellerDeals: (DealRow & { buyerName: string })[];
}

const DEAL_STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  pending:   { label: "Pending review",  classes: "bg-yellow-900/20 text-yellow-400 border border-yellow-600/20" },
  accepted:  { label: "Accepted",        classes: "bg-neon-green/10 text-neon-green border border-neon-green/20" },
  completed: { label: "Completed",       classes: "bg-green-900/20 text-green-400 border border-green-600/20" },
  cancelled: { label: "Cancelled",       classes: "bg-zinc-800 text-zinc-400 border border-zinc-700" },
};

export function SellerDealRequests({ sellerDeals }: SellerDealRequestsProps) {
  const pendingCount = sellerDeals.filter((d) => d.status === "pending").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Deal Requests</CardTitle>
          {pendingCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sellerDeals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No requests yet</p>
        ) : (
          <div className="divide-y divide-border">
            {sellerDeals.map((deal) => {
              const s = DEAL_STATUS_LABEL[deal.status];
              return (
                <div
                  key={deal.id}
                  className="py-3 first:pt-0 last:pb-0 space-y-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-overlay/[0.06] border border-border flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {deal.buyerName[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{deal.buyerName}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(deal.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          {deal.proposed_days ? (
                            <span className="ml-2 text-indigo-400 font-medium">
                              · {deal.proposed_days}d rental
                              {deal.proposed_start_date && (
                                <span className="ml-1 text-muted-foreground font-normal">
                                  from{" "}
                                  {new Date(deal.proposed_start_date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${
                          s?.classes ?? ""
                        }`}
                      >
                        {s?.label ?? deal.status}
                      </span>
                      <DealActions dealId={deal.id} dealStatus={deal.status} role="seller" />
                    </div>
                  </div>

                  {/* Contact reveal — show buyer's phone once deal is accepted */}
                  {deal.status === "accepted" && (
                    <div className="flex items-center gap-3 pl-11">
                      <p className="text-xs text-muted-foreground shrink-0">Buyer&apos;s contact</p>
                      <ContactReveal dealId={deal.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
