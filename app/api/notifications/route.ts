import { createClient } from "@/lib/supabase/server";
import {
  getAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/utils/query/notifications";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notifications — list all notifications
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getAllNotifications(supabase);
  return NextResponse.json({ notifications });
}

// POST /api/notifications — mark all as read
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsRead(supabase);
  return NextResponse.json({ ok: true });
}

// PATCH /api/notifications — mark a single notification as read
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: string;
  try {
    const body = await request.json();
    id = body.id;
    if (!id || typeof id !== "string") throw new Error("invalid id");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await markNotificationRead(supabase, id);
  return NextResponse.json({ ok: true });
}
