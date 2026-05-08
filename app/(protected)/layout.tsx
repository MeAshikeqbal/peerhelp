/**
 * Pass-through wrapper for the (protected) route group.
 *
 * Each child route group owns its own shell + nav:
 *   - (admin)        — AdminNav + admin auth gate
 *   - (dashboard)    — AppNav with pending-deals badge
 *   - (verification) — AppNav (no badge needed)
 *
 * Keeping this layout intentionally minimal so the route-group structure stays
 * symmetric and any future shared session work has a clear home.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
