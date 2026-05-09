import { ImageResponse } from "next/og";
import { renderLogoMark } from "../_icon";

export function GET() {
  return new ImageResponse(renderLogoMark(192, 192), {
    width: 192,
    height: 192,
  });
}
