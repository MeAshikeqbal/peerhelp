import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm:  { avatar: "h-8 w-8",   text: "text-xs"  },
  md:  { avatar: "h-10 w-10", text: "text-sm"  },
  lg:  { avatar: "h-16 w-16", text: "text-xl"  },
  xl:  { avatar: "h-20 w-20", text: "text-2xl" },
};

export function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) return ((parts[0]?.[0] || local[0] || "") + (parts[1]?.[0] || local[1] || "")).toUpperCase();
    return (local.slice(0, 2) || "").toUpperCase();
  }
  return "?";
}

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function UserAvatar({ src, name, email, size = "md", className }: UserAvatarProps) {
  const { avatar, text } = sizeMap[size];
  const initials = getInitials(name, email);

  return (
    <Avatar className={cn(avatar, "shrink-0", className)}>
      {src && <AvatarImage src={src} alt={name ?? "User"} />}
      <AvatarFallback
        className={cn(
          "bg-neon-green/10 text-neon-green font-bold",
          text,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
