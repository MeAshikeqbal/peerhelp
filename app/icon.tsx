import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const file = await readFile(join(process.cwd(), "public", "icon.png"));
  return new NextResponse(file, {
    headers: { "Content-Type": "image/png" },
  });
}
