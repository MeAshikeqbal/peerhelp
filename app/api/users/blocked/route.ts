import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getMyBlockedUsers } from "@/utils/query/blocks";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const blocked = await getMyBlockedUsers(supabase);
  if (blocked.length === 0) {
    return NextResponse.json({ blocked: [] });
  }

  const ids = blocked.map((b) => b.blocked_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return NextResponse.json({
    blocked: blocked.map((b) => ({
      blocked_id: b.blocked_id,
      full_name: nameMap.get(b.blocked_id) ?? null,
      reason: b.reason,
      created_at: b.created_at,
    })),
  });
}
