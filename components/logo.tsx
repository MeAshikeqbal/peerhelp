import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  asLink?: boolean;
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("group/logo inline-flex items-baseline font-display select-none", className)}>
      {/* Wordmark — "Peer" dominant, "Help" slightly receded */}
      <span className="tracking-[0.24em]">
        <span className="font-[700]">Peer</span>
        <span className="font-[600] opacity-70">Help</span>
      </span>
      {/* Slashes — default soft glow, ignite on hover with stagger */}
      <span className="ml-0.5 tracking-tight">
        <span
          className="text-neon-green font-[500] transition-[filter] duration-200
                     [filter:drop-shadow(0_0_4px_rgba(54,244,164,0.4))]
                     group-hover/logo:[filter:drop-shadow(0_0_10px_rgba(54,244,164,0.9))]"
        >/</span>
        <span
          className="text-neon-green font-[300] transition-[filter] duration-200 delay-75
                     [filter:drop-shadow(0_0_4px_rgba(54,244,164,0.25))]
                     group-hover/logo:[filter:drop-shadow(0_0_10px_rgba(54,244,164,0.9))]"
        >/</span>
        <span
          className="text-neon-green font-[100] transition-[filter] duration-200 delay-150
                     [filter:drop-shadow(0_0_4px_rgba(54,244,164,0.1))]
                     group-hover/logo:[filter:drop-shadow(0_0_10px_rgba(54,244,164,0.9))]"
        >/</span>
      </span>
    </span>
  );
}

export function Logo({ className, href = "/dashboard", asLink = true }: LogoProps) {
  if (asLink) {
    return (
      <Link href={href} className={cn("text-foreground hover:text-foreground transition-colors", className)}>
        <LogoMark />
      </Link>
    );
  }

  return (
    <span className={cn("text-foreground", className)}>
      <LogoMark />
    </span>
  );
}
