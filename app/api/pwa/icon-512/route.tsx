import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const file = await readFile(join(process.cwd(), "public", "icon.png"));
  return new NextResponse(file, {
    headers: { "Content-Type": "image/png" },
  });
}
