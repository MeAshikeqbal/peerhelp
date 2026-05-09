import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin } from "@/utils/query/admin";
import { adminGetThreadMessages } from "@/utils/query/messages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await adminGetThreadMessages(supabase, threadId);
  if (error) {
    console.error("[admin reports thread messages]", error);
    return NextResponse.json({ message: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json({ messages: messages ?? [] });
}
