import { ImageResponse } from "next/og";
import { renderLogoMark } from "../_icon";

export function GET() {
  return new ImageResponse(renderLogoMark(512, 512), {
    width: 512,
    height: 512,
  });
}
