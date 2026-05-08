import Image from "next/image";
import { BookOpen, FileText } from "lucide-react";

interface ListingImagePanelProps {
  imageUrl: string | null;
  title: string;
  listingType: string;
  /** When true, marks the image as priority (eager) for LCP. Use for above-the-fold detail pages. */
  priority?: boolean;
}

export function ListingImagePanel({ imageUrl, title, listingType, priority = false }: ListingImagePanelProps) {
  const TypeIcon = listingType === "other" ? FileText : BookOpen;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-overlay/[0.03]">
      {imageUrl ? (
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={priority}
            loading={priority ? "eager" : undefined}
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-overlay/[0.02]">
          <TypeIcon size={56} className="text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/50">No image</p>
        </div>
      )}
    </div>
  );
}
