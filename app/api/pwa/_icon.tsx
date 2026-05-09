/**
 * Shared icon rendering helper for PWA icon API routes.
 * Uses inline styles only — no Tailwind classes or custom fonts at runtime.
 */

export function renderLogoMark(width: number, height: number) {
  const radius = Math.round(width * 0.1875); // ~12/64 ratio
  const pSize = Math.round(width * 0.5);
  const slashSize = Math.round(width * 0.4375);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        borderRadius: `${radius}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        {/* "P" — bold white */}
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: pSize,
            color: "#ffffff",
            letterSpacing: 1,
          }}
        >
          P
        </span>
        {/* "/" — neon-green brand accent */}
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            fontSize: slashSize,
            color: "#36F4A4",
            marginLeft: Math.round(width * 0.03),
          }}
        >
          /
        </span>
      </div>
    </div>
  );
}
