import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getThreadById, getThreadMessages } from "@/utils/query/messages";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: thread } = await getThreadById(supabase, threadId);
  if (!thread) {
    return NextResponse.json({ message: "Thread not found" }, { status: 404 });
  }
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);

  const { data: messages, error } = await getThreadMessages(supabase, threadId, {
    limit,
    before,
  });
  if (error) {
    console.error("[messages GET]", error);
    return NextResponse.json({ message: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ thread, messages: messages ?? [] });
}
