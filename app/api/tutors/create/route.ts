import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus } from "@/utils/query/profiles";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createTutorProfile,
  TUTOR_MODES,
  type TutorMode,
} from "@/utils/query/tutors";
import { validateImageUrl } from "@/lib/listing-image";

const WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX = 10;

const HEADLINE_MAX = 120;
const BIO_MAX = 2000;
const AVAILABILITY_MAX = 200;
const EXPERIENCE_MAX = 500;
const SUBJECT_MAX_LEN = 60;
const LANGUAGE_MAX_LEN = 40;
const RATE_MAX = 1_000_000;

function sanitizeStringList(
  raw: unknown,
  { min, max, itemMax }: { min: number; max: number; itemMax: number },
): { ok: true; value: string[] } | { ok: false; message: string } {
  if (!Array.isArray(raw)) return { ok: false, message: "Expected array" };
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (trimmed.length > itemMax) {
      return {
        ok: false,
        message: `Each entry must be at most ${itemMax} characters`,
      };
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
    if (cleaned.length >= max) break;
  }
  if (cleaned.length < min) {
    return {
      ok: false,
      message: `Provide between ${min} and ${max} entries`,
    };
  }
  return { ok: true, value: cleaned };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkRateLimit(
      supabase,
      user.id,
      "tutor_create",
      MAX,
      WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "Too many attempts. Please wait and try again.",
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
        { message: "You must be verified to create a tutor profile" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const {
      headline,
      bio,
      subjects,
      mode,
      hourly_rate,
      availability,
      languages,
      experience,
      image_url,
    } = body as Record<string, unknown>;

    if (typeof headline !== "string" || !headline.trim()) {
      return NextResponse.json(
        { message: "Headline is required" },
        { status: 400 },
      );
    }
    const headlineTrim = headline.trim();
    if (headlineTrim.length > HEADLINE_MAX) {
      return NextResponse.json(
        { message: `Headline must be at most ${HEADLINE_MAX} characters` },
        { status: 400 },
      );
    }

    if (
      typeof mode !== "string" ||
      !(TUTOR_MODES as readonly string[]).includes(mode)
    ) {
      return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }

    const rateInt =
      typeof hourly_rate === "number"
        ? Math.trunc(hourly_rate)
        : parseInt(String(hourly_rate ?? ""), 10);
    if (Number.isNaN(rateInt) || rateInt < 0 || rateInt > RATE_MAX) {
      return NextResponse.json(
        { message: "Hourly rate must be between 0 and 1,000,000" },
        { status: 400 },
      );
    }

    const subjectsResult = sanitizeStringList(subjects, {
      min: 1,
      max: 8,
      itemMax: SUBJECT_MAX_LEN,
    });
    if (!subjectsResult.ok) {
      return NextResponse.json(
        { message: `Subjects: ${subjectsResult.message}` },
        { status: 400 },
      );
    }

    let languagesValue: string[] | null = null;
    if (languages !== undefined && languages !== null) {
      const result = sanitizeStringList(languages, {
        min: 0,
        max: 6,
        itemMax: LANGUAGE_MAX_LEN,
      });
      if (!result.ok) {
        return NextResponse.json(
          { message: `Languages: ${result.message}` },
          { status: 400 },
        );
      }
      languagesValue = result.value.length ? result.value : null;
    }

    function trimOptional(
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
        return {
          ok: false,
          message: `${label} must be at most ${max} characters`,
        };
      return { ok: true, value: t };
    }

    const bioResult = trimOptional(bio, BIO_MAX, "Bio");
    if (!bioResult.ok)
      return NextResponse.json({ message: bioResult.message }, { status: 400 });

    const availabilityResult = trimOptional(
      availability,
      AVAILABILITY_MAX,
      "Availability",
    );
    if (!availabilityResult.ok)
      return NextResponse.json(
        { message: availabilityResult.message },
        { status: 400 },
      );

    const experienceResult = trimOptional(
      experience,
      EXPERIENCE_MAX,
      "Experience",
    );
    if (!experienceResult.ok)
      return NextResponse.json(
        { message: experienceResult.message },
        { status: 400 },
      );

    let imageUrlValue: string | null = null;
    if (image_url) {
      const err = validateImageUrl(String(image_url), user.id);
      if (err) return NextResponse.json({ message: err }, { status: 400 });
      imageUrlValue = String(image_url);
    }

    const { data, error } = await createTutorProfile(supabase, {
      user_id: user.id,
      headline: headlineTrim,
      bio: bioResult.value,
      subjects: subjectsResult.value,
      mode: mode as TutorMode,
      hourly_rate: rateInt,
      availability: availabilityResult.value,
      languages: languagesValue,
      experience: experienceResult.value,
      image_url: imageUrlValue,
    });

    if (error) {
      // 23505 unique_violation — user already has an active profile.
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { message: "You already have an active tutor profile" },
          { status: 409 },
        );
      }
      console.error("Tutor profile create error:", error);
      return NextResponse.json(
        { message: "Failed to create tutor profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tutor: data }, { status: 201 });
  } catch (err) {
    console.error("tutors/create error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
