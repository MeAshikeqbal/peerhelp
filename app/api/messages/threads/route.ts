import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getUserThreads, startOrGetThread } from "@/utils/query/messages";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const threads = await getUserThreads(supabase);
  return NextResponse.json({ threads });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: { context_type?: string; context_id?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { context_type, context_id } = payload;
  if (
    (context_type !== "deal" && context_type !== "tutor_request") ||
    typeof context_id !== "string"
  ) {
    return NextResponse.json({ message: "Invalid context" }, { status: 400 });
  }

  const { data, error } = await startOrGetThread(supabase, context_type, context_id);
  if (error) {
    const msg = error.message ?? "Failed to start thread";
    const status =
      msg.includes("not_a_participant") || msg.includes("blocked") ? 403
      : msg.includes("invalid_context_type") ? 400
      : 500;
    return NextResponse.json({ message: msg }, { status });
  }
  return NextResponse.json({ thread: data });
}
