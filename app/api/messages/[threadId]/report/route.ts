import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { reportMessage } from "@/utils/query/messages";
import { checkRateLimit } from "@/lib/rate-limit";

const REPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const REPORT_MAX = 10;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    supabase,
    user.id,
    "user_report",
    REPORT_MAX,
    REPORT_WINDOW_MS,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Too many reports. Please try again later.", retryAfter: rate.retryAfter },
      { status: 429 },
    );
  }

  let payload: { message_id?: string | null; reason?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const reason = (payload.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json({ message: "Reason is required" }, { status: 400 });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ message: "Reason too long" }, { status: 400 });
  }

  const { data, error } = await reportMessage(
    supabase,
    threadId,
    payload.message_id ?? null,
    reason,
  );
  if (error) {
    const m = error.message ?? "Failed to report";
    const status =
      m.includes("not_a_participant") ? 403
      : m.includes("invalid") || m.includes("empty") || m.includes("too_long") ? 400
      : 500;
    return NextResponse.json({ message: m }, { status });
  }
  return NextResponse.json({ report_id: data });
}
