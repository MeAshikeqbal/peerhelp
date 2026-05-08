import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getUserEmail } from "@/utils/query/profiles";
import { notifyUser } from "@/lib/notifications/notify";
import {
  getRequestById,
  updateRequestStatus,
  type TutorRequestStatus,
} from "@/utils/query/tutors";

const ALLOWED: Record<
  TutorRequestStatus,
  Partial<Record<"tutor" | "learner", TutorRequestStatus[]>>
> = {
  pending: {
    tutor: ["accepted", "declined"],
    learner: ["cancelled"],
  },
  accepted: {
    tutor: ["completed", "cancelled"],
    learner: ["completed", "cancelled"],
  },
  declined: {},
  cancelled: {},
  completed: {},
};

export async function PATCH(
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

    const { data: existing } = await getRequestById(supabase, id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const role: "tutor" | "learner" | null =
      existing.tutor_user_id === user.id
        ? "tutor"
        : existing.learner_user_id === user.id
          ? "learner"
          : null;
    if (!role) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const next = (body as { status?: unknown } | null)?.status;
    if (
      next !== "accepted" &&
      next !== "declined" &&
      next !== "cancelled" &&
      next !== "completed"
    ) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const allowed = ALLOWED[existing.status as TutorRequestStatus]?.[role] ?? [];
    if (!allowed.includes(next)) {
      return NextResponse.json(
        {
          message: `Cannot transition from ${existing.status} to ${next}`,
        },
        { status: 409 },
      );
    }

    const { data, error } = await updateRequestStatus(supabase, id, next);
    if (error) {
      console.error("request status update error:", error);
      return NextResponse.json(
        { message: "Failed to update request" },
        { status: 500 },
      );
    }

    // Notify the counterparty (non-blocking).
    try {
      const recipientId =
        role === "tutor" ? existing.learner_user_id : existing.tutor_user_id;
      const recipientEmail = await getUserEmail(supabase, recipientId);
      if (recipientEmail) {
        const map: Record<TutorRequestStatus, { title: string; body: string }> =
          {
            accepted: {
              title: "Tutor request accepted",
              body: `Your request for "${existing.subject}" was accepted. Coordinate next steps with your tutor.`,
            },
            declined: {
              title: "Tutor request declined",
              body: `Your request for "${existing.subject}" was declined.`,
            },
            cancelled: {
              title: "Tutor request cancelled",
              body: `A request for "${existing.subject}" was cancelled.`,
            },
            completed: {
              title: "Tutor session completed",
              body: `The session for "${existing.subject}" was marked completed.`,
            },
            pending: { title: "", body: "" },
          };
        const meta = map[next];
        if (meta.title) {
          await notifyUser(supabase, {
            recipientId,
            recipientEmail,
            type: "tutor_request_responded",
            title: meta.title,
            body: meta.body,
          });
        }
      }
    } catch (notifErr) {
      console.error("notify counterparty error (non-fatal):", notifErr);
    }

    return NextResponse.json({ request: data });
  } catch (err) {
    console.error("tutor request PATCH error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
