import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { blockUser, unblockUser } from "@/utils/query/blocks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (userId === user.id) {
    return NextResponse.json({ message: "Cannot block yourself" }, { status: 400 });
  }

  let reason: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.reason === "string") {
      reason = body.reason.trim().slice(0, 500) || undefined;
    }
  } catch {
    // optional body
  }

  const { error } = await blockUser(supabase, userId, reason);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { error } = await unblockUser(supabase, userId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
