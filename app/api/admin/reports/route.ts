import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin } from "@/utils/query/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const VALID = ["pending", "reviewed", "dismissed", "all"] as const;
  const raw = searchParams.get("status") ?? "pending";
  const status = (VALID as readonly string[]).includes(raw) ? raw : "pending";

  let q = supabase
    .from("message_reports")
    .select(
      "id, reporter_id, reported_user_id, thread_id, message_id, reason, status, created_at, reviewed_at, reviewed_by",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    q = q.eq("status", status as "pending" | "reviewed" | "dismissed");
  }

  const { data: reports, error } = await q;
  if (error) {
    console.error("[admin reports]", error);
    return NextResponse.json({ message: "Failed to load" }, { status: 500 });
  }

  // Fetch profile names for reporter + reported.
  const ids = Array.from(
    new Set((reports ?? []).flatMap((r) => [r.reporter_id, r.reported_user_id])),
  );
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return NextResponse.json({
    reports: (reports ?? []).map((r) => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) ?? null,
      reported_name: nameMap.get(r.reported_user_id) ?? null,
    })),
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let payload: { id?: string; status?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const { id, status } = payload;
  if (typeof id !== "string" || (status !== "reviewed" && status !== "dismissed")) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { error } = await supabase
    .from("message_reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin reports PATCH]", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
