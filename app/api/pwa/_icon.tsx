/**
 * Shared icon rendering helper for PWA icon API routes.
 * Uses inline styles only — no Tailwind classes or custom fonts at runtime.
 */

export function renderLogoMark(width: number, height: number) {
  const textSize = Math.round(width * 0.22);
  const slashSize = Math.round(width * 0.2);
  const padding = Math.round(width * 0.14);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        padding: `${padding}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        {/* "Peer" — dominant */}
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: textSize,
            color: "#ffffff",
            letterSpacing: textSize * 0.12,
          }}
        >
          Peer
        </span>
        {/* "Help" — receded */}
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 600,
            fontSize: textSize,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: textSize * 0.12,
          }}
        >
          Help
        </span>
        {/* "///" — neon-green brand accent */}
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            fontSize: slashSize,
            color: "#36F4A4",
            marginLeft: Math.round(width * 0.025),
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 300,
            fontSize: Math.round(slashSize * 0.9),
            color: "#36F4A4",
            opacity: 0.75,
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 100,
            fontSize: Math.round(slashSize * 0.8),
            color: "#36F4A4",
            opacity: 0.45,
          }}
        >
          /
        </span>
      </div>
    </div>
  );
}
