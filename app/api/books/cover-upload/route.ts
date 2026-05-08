import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";

/** Hostnames we allow proxying images from — exactly the sources the lookup route uses. */
const ALLOWED_HOSTS = new Set([
  "covers.openlibrary.org",
  "books.google.com",
  "books.googleusercontent.com",
]);

function isAllowedCoverUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw);
    if (protocol !== "https:") return false;
    // Accept *.googleapis.com (Google Books thumbnail CDN)
    if (hostname.endsWith(".googleapis.com")) return true;
    return ALLOWED_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);

  if (userError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let coverUrl: string;
  try {
    const body = await request.json();
    coverUrl = body?.coverUrl;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (typeof coverUrl !== "string" || !coverUrl) {
    return NextResponse.json({ message: "Missing coverUrl" }, { status: 400 });
  }

  if (!isAllowedCoverUrl(coverUrl)) {
    return NextResponse.json({ message: "Cover URL is not from an allowed source" }, { status: 400 });
  }

  // Fetch the image server-side (avoids CORS and validates it is a real image)
  let imageBuffer: ArrayBuffer;
  let contentType: string;
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) {
      return NextResponse.json({ message: "Failed to fetch cover image" }, { status: 502 });
    }
    contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!ALLOWED_TYPES.has(contentType)) {
      // Default to jpeg for covers that don't set a proper content-type
      contentType = "image/jpeg";
    }
    imageBuffer = await res.arrayBuffer();
  } catch {
    return NextResponse.json({ message: "Failed to fetch cover image" }, { status: 502 });
  }

  if (imageBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ message: "Cover image exceeds 5 MB limit" }, { status: 400 });
  }

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(path, imageBuffer, {
      contentType,
      cacheControl: "31536000", // 1 year — cover images are immutable
      upsert: false,
    });

  if (uploadError) {
    console.error("Cover upload error:", uploadError);
    return NextResponse.json({ message: "Failed to upload cover image" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);

  return NextResponse.json({ storageUrl: publicUrl });
}
