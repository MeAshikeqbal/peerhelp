/**
 * Validate that an image_url, if provided, points at the Supabase Storage
 * `images` bucket and lives under the current user's path prefix, OR is
 * a safelisted Open Library cover URL.
 *
 * Returns null if valid, or a string error message.
 */
export function validateImageUrl(url: string, userId: string): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid image URL";
  }
  if (parsed.protocol !== "https:") return "Image URL must be HTTPS";

  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    } catch {
      return null;
    }
  })();
  if (!supabaseHost || parsed.hostname !== supabaseHost) {
    return "Image URL must point to Supabase Storage";
  }
  const expectedPrefix = `/storage/v1/object/public/images/${userId}/`;
  if (!parsed.pathname.startsWith(expectedPrefix)) {
    return "Image URL must belong to your storage path";
  }
  return null;
}
