import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { markThreadRead } from "@/utils/query/messages";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { error } = await markThreadRead(supabase, threadId);
  if (error) {
    const status = error.message?.includes("not_a_participant") ? 403 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
