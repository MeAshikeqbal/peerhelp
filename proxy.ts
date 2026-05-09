import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, apple-icon (Next.js metadata images)
     * - sw.js, manifest.webmanifest (PWA assets — no session needed)
     * - api/pwa/* (icon generation routes — public, no auth)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp, .woff2
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon|apple-icon|sw\\.js|manifest\\.webmanifest|api/pwa|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
