import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <span
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "#ffffff",
          letterSpacing: 1,
        }}
      >
        P
      </span>
      <span
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          color: "#36F4A4",
          marginLeft: 1,
        }}
      >
        /
      </span>
    </div>,
    { ...size }
  );
}
