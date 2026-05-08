import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export interface TutorCardData {
  id: string;
  headline: string;
  subjects: string[];
  mode: string;
  hourly_rate: number;
  availability: string | null;
  languages: string[] | null;
  image_url: string | null;
}

interface TutorCardProps {
  tutor: TutorCardData;
  href: string;
  priority?: boolean;
}

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

export function TutorCard({ tutor, href, priority = false }: TutorCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-accent/50 cursor-pointer transition overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-forest flex items-center justify-center border-b border-border">
          {tutor.image_url ? (
            <Image
              src={tutor.image_url}
              alt={tutor.headline}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-overlay/[0.02]">
              <GraduationCap size={28} className="text-muted-foreground/40" />
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 text-lg">{tutor.headline}</CardTitle>
          <CardDescription>
            {MODE_LABEL[tutor.mode] ?? tutor.mode}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-display text-2xl font-bold text-accent">
            ₹{tutor.hourly_rate.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / hour
            </span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex flex-wrap gap-1">
              {tutor.subjects.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-shade-30"
                >
                  {s}
                </span>
              ))}
              {tutor.subjects.length > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{tutor.subjects.length - 3}
                </span>
              )}
            </div>
            {tutor.availability && (
              <div className="line-clamp-1">{tutor.availability}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
