import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const file = await readFile(join(process.cwd(), "public", "icon.png"));
  return new NextResponse(file, {
    headers: { "Content-Type": "image/png" },
  });
}
