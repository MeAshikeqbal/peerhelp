import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import {
  archiveTutorProfile,
  getTutorById,
  TUTOR_MODES,
  updateTutorProfile,
  type TutorMode,
  type TutorProfileUpdate,
} from "@/utils/query/tutors";
import { validateImageUrl } from "@/lib/listing-image";

const HEADLINE_MAX = 120;
const BIO_MAX = 2000;
const AVAILABILITY_MAX = 200;
const EXPERIENCE_MAX = 500;
const SUBJECT_MAX_LEN = 60;
const LANGUAGE_MAX_LEN = 40;
const RATE_MAX = 1_000_000;

function cleanList(
  raw: unknown,
  { min, max, itemMax }: { min: number; max: number; itemMax: number },
): { ok: true; value: string[] } | { ok: false; message: string } {
  if (!Array.isArray(raw)) return { ok: false, message: "Expected array" };
  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of raw) {
    if (typeof e !== "string") continue;
    const t = e.trim();
    if (!t) continue;
    if (t.length > itemMax)
      return { ok: false, message: `Each entry ≤ ${itemMax} chars` };
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length > max) break;
  }
  if (out.length < min)
    return { ok: false, message: `Provide ${min}–${max} entries` };
  return { ok: true, value: out };
}

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

    const { data: existing } = await getTutorById(supabase, id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const patch: TutorProfileUpdate = {};

    if ("headline" in body) {
      const v = (body as { headline?: unknown }).headline;
      if (typeof v !== "string" || !v.trim())
        return NextResponse.json(
          { message: "Headline cannot be empty" },
          { status: 400 },
        );
      const t = v.trim();
      if (t.length > HEADLINE_MAX)
        return NextResponse.json(
          { message: `Headline ≤ ${HEADLINE_MAX} chars` },
          { status: 400 },
        );
      patch.headline = t;
    }

    if ("mode" in body) {
      const v = (body as { mode?: unknown }).mode;
      if (typeof v !== "string" || !(TUTOR_MODES as readonly string[]).includes(v))
        return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
      patch.mode = v as TutorMode;
    }

    if ("hourly_rate" in body) {
      const raw = (body as { hourly_rate?: unknown }).hourly_rate;
      const n =
        typeof raw === "number"
          ? Math.trunc(raw)
          : parseInt(String(raw ?? ""), 10);
      if (Number.isNaN(n) || n < 0 || n > RATE_MAX)
        return NextResponse.json(
          { message: "Hourly rate must be 0–1,000,000" },
          { status: 400 },
        );
      patch.hourly_rate = n;
    }

    if ("subjects" in body) {
      const r = cleanList((body as { subjects?: unknown }).subjects, {
        min: 1,
        max: 8,
        itemMax: SUBJECT_MAX_LEN,
      });
      if (!r.ok)
        return NextResponse.json(
          { message: `Subjects: ${r.message}` },
          { status: 400 },
        );
      patch.subjects = r.value;
    }

    if ("languages" in body) {
      const v = (body as { languages?: unknown }).languages;
      if (v === null) {
        patch.languages = null;
      } else {
        const r = cleanList(v, { min: 0, max: 6, itemMax: LANGUAGE_MAX_LEN });
        if (!r.ok)
          return NextResponse.json(
            { message: `Languages: ${r.message}` },
            { status: 400 },
          );
        patch.languages = r.value.length ? r.value : null;
      }
    }

    function setOptional(
      key: "bio" | "availability" | "experience",
      max: number,
    ) {
      if (!(key in body)) return null;
      const v = (body as Record<string, unknown>)[key];
      if (v === null || v === "") {
        patch[key] = null;
        return null;
      }
      if (typeof v !== "string")
        return `${key} must be a string`;
      const t = v.trim();
      if (!t) {
        patch[key] = null;
        return null;
      }
      if (t.length > max) return `${key} ≤ ${max} chars`;
      patch[key] = t;
      return null;
    }

    for (const [key, max] of [
      ["bio", BIO_MAX] as const,
      ["availability", AVAILABILITY_MAX] as const,
      ["experience", EXPERIENCE_MAX] as const,
    ]) {
      const err = setOptional(key, max);
      if (err) return NextResponse.json({ message: err }, { status: 400 });
    }

    if ("image_url" in body) {
      const v = (body as { image_url?: unknown }).image_url;
      if (v === null || v === "") {
        patch.image_url = null;
      } else if (typeof v === "string") {
        const err = validateImageUrl(v, user.id);
        if (err) return NextResponse.json({ message: err }, { status: 400 });
        patch.image_url = v;
      } else {
        return NextResponse.json(
          { message: "image_url must be a string" },
          { status: 400 },
        );
      }
    }

    if ("status" in body) {
      const v = (body as { status?: unknown }).status;
      if (v !== "active" && v !== "paused" && v !== "archived")
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      patch.status = v;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ tutor: existing });
    }

    const { data, error } = await updateTutorProfile(supabase, id, patch);
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { message: "You already have an active tutor profile" },
          { status: 409 },
        );
      }
      console.error("tutor update error:", error);
      return NextResponse.json(
        { message: "Failed to update" },
        { status: 500 },
      );
    }
    return NextResponse.json({ tutor: data });
  } catch (err) {
    console.error("tutors/[id] PATCH error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { data: existing } = await getTutorById(supabase, id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { error } = await archiveTutorProfile(supabase, id);
    if (error) {
      console.error("tutor archive error:", error);
      return NextResponse.json(
        { message: "Failed to archive" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("tutors/[id] DELETE error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
