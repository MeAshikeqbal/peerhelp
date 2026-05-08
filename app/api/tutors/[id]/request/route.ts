import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getUserEmail, getVerificationStatus } from "@/utils/query/profiles";
import { checkRateLimit } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/notifications/notify";
import {
  createSessionRequest,
  getTutorById,
  TUTOR_MODES,
  type TutorMode,
} from "@/utils/query/tutors";

const WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX = 30;

const SUBJECT_MAX = 60;
const PROPOSED_WHEN_MAX = 120;
const MESSAGE_MAX = 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkRateLimit(
      supabase,
      user.id,
      "tutor_request",
      MAX,
      WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "You're sending requests too quickly. Please wait.",
          retryAfter: rate.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfter ?? 60) },
        },
      );
    }

    const { data: profile } = await getVerificationStatus(supabase, user.id);
    if (profile?.verification_status !== "verified") {
      return NextResponse.json(
        { message: "You must be verified to request tutor sessions" },
        { status: 403 },
      );
    }

    const { data: tutor } = await getTutorById(supabase, id);
    if (!tutor || tutor.status !== "active") {
      return NextResponse.json(
        { message: "Tutor profile not available" },
        { status: 404 },
      );
    }
    if (tutor.user_id === user.id) {
      return NextResponse.json(
        { message: "You can't request a session from yourself" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }
    const { subject, mode, proposed_when, message } = body as Record<
      string,
      unknown
    >;

    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { message: "Subject is required" },
        { status: 400 },
      );
    }
    const subjectTrim = subject.trim();
    if (subjectTrim.length > SUBJECT_MAX) {
      return NextResponse.json(
        { message: `Subject ≤ ${SUBJECT_MAX} chars` },
        { status: 400 },
      );
    }

    if (
      typeof mode !== "string" ||
      !(TUTOR_MODES as readonly string[]).includes(mode)
    ) {
      return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }

    function optString(
      v: unknown,
      max: number,
      label: string,
    ): { ok: true; value: string | null } | { ok: false; message: string } {
      if (v === undefined || v === null || v === "")
        return { ok: true, value: null };
      if (typeof v !== "string")
        return { ok: false, message: `${label} must be a string` };
      const t = v.trim();
      if (!t) return { ok: true, value: null };
      if (t.length > max)
        return { ok: false, message: `${label} ≤ ${max} chars` };
      return { ok: true, value: t };
    }

    const propRes = optString(proposed_when, PROPOSED_WHEN_MAX, "Proposed when");
    if (!propRes.ok)
      return NextResponse.json({ message: propRes.message }, { status: 400 });
    const msgRes = optString(message, MESSAGE_MAX, "Message");
    if (!msgRes.ok)
      return NextResponse.json({ message: msgRes.message }, { status: 400 });

    const { data: req, error } = await createSessionRequest(supabase, {
      tutor_profile_id: tutor.id,
      tutor_user_id: tutor.user_id,
      learner_user_id: user.id,
      subject: subjectTrim,
      mode: mode as TutorMode,
      proposed_when: propRes.value,
      message: msgRes.value,
      status: "pending",
    });

    if (error) {
      console.error("session request insert error:", error);
      return NextResponse.json(
        { message: "Failed to send request" },
        { status: 500 },
      );
    }

    // Notify tutor (fire-and-forget; does not block the response)
    void getUserEmail(supabase, tutor.user_id)
      .then((tutorEmail) => {
        if (!tutorEmail) return;
        return notifyUser(supabase, {
          recipientId: tutor.user_id,
          recipientEmail: tutorEmail,
          type: "tutor_request_received",
          title: "New tutor session request",
          body: `You have a new tutoring request for "${subjectTrim}". Review it and accept or decline.`,
        });
      })
      .catch((err) => console.error("notify tutor error (non-fatal):", err));

    return NextResponse.json({ request: req }, { status: 201 });
  } catch (err) {
    console.error("tutors/[id]/request error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
