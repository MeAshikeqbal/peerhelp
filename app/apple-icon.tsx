import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        padding: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: 40,
            color: "#ffffff",
            letterSpacing: 5,
          }}
        >
          Peer
        </span>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 600,
            fontSize: 40,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 5,
          }}
        >
          Help
        </span>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            fontSize: 36,
            color: "#36F4A4",
            marginLeft: 4,
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 300,
            fontSize: 32,
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
            fontSize: 28,
            color: "#36F4A4",
            opacity: 0.45,
          }}
        >
          /
        </span>
      </div>
    </div>,
    { ...size }
  );
}
