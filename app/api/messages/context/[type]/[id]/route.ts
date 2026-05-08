import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await params;
  if (type !== "deal" && type !== "tutor_request") {
    return NextResponse.json({ message: "Invalid context type" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Verify the caller is a participant in a thread linked to this context.
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id")
    .eq("context_type", type)
    .eq("context_id", id)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .maybeSingle();

  if (!thread) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (type === "deal") {
    const { data, error } = await supabase
      .from("deals")
      .select(
        "id, status, created_at, listing_id, listings(title, price, condition, image_url, transaction_type)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ type: "deal", deal: data });
  }

  // tutor_request
  const { data, error } = await supabase
    .from("tutor_session_requests")
    .select("id, subject, mode, proposed_when, status, message")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ type: "tutor_request", request: data });
}
