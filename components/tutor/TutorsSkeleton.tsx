import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TutorsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden animate-pulse">
          <div className="aspect-[16/9] w-full bg-overlay/[0.04]" />
          <CardHeader className="pb-3">
            <CardTitle>
              <div className="h-5 w-3/4 rounded bg-overlay/[0.06]" />
            </CardTitle>
            <div className="h-3 w-24 rounded bg-overlay/[0.04] mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-7 w-24 rounded bg-overlay/[0.06]" />
            <div className="h-3 w-2/3 rounded bg-overlay/[0.04]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
