import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { DB } from "./_db";

export type TutorProfile = Tables<"tutor_profiles">;
export type TutorProfileInsert = TablesInsert<"tutor_profiles">;
export type TutorProfileUpdate = TablesUpdate<"tutor_profiles">;
export type TutorSessionRequest = Tables<"tutor_session_requests">;
export type TutorSessionRequestInsert = TablesInsert<"tutor_session_requests">;
export type TutorSessionRequestUpdate = TablesUpdate<"tutor_session_requests">;

export type TutorMode = "online" | "in_person" | "hybrid";
export type TutorStatus = "active" | "paused" | "archived";
export type TutorRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export const TUTOR_MODES: readonly TutorMode[] = [
  "online",
  "in_person",
  "hybrid",
] as const;

type TutorRow = Database["public"]["Tables"]["tutor_profiles"]["Row"];

export interface TutorFilters {
  q?: string;
  subject?: string;
  mode?: string;
  minRate?: number;
  maxRate?: number;
  page?: number;
  pageSize?: number;
}

const TUTOR_LIST_COLUMNS =
  "id, user_id, headline, subjects, mode, hourly_rate, availability, languages, image_url, created_at" as const;

const TUTOR_DETAIL_COLUMNS =
  "id, user_id, headline, bio, subjects, mode, hourly_rate, availability, languages, experience, image_url, status, created_at, updated_at" as const;

/**
 * Paginated active tutor profiles with optional filters.
 */
export async function getActiveTutors(
  supabase: DB,
  filters: TutorFilters = {},
) {
  const pageSize = filters.pageSize ?? 12;
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("tutor_profiles")
    .select(TUTOR_LIST_COLUMNS, { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.q) query = query.ilike("headline", `%${filters.q}%`);
  if (filters.subject) query = query.contains("subjects", [filters.subject]);
  if (
    filters.mode &&
    (TUTOR_MODES as readonly string[]).includes(filters.mode)
  ) {
    query = query.eq("mode", filters.mode as TutorRow["mode"]);
  }
  if (filters.minRate !== undefined)
    query = query.gte("hourly_rate", filters.minRate);
  if (filters.maxRate !== undefined)
    query = query.lte("hourly_rate", filters.maxRate);

  return query.range(offset, offset + pageSize - 1);
}

/** Public-readable when status='active'; owner can read their own. */
export async function getTutorById(supabase: DB, id: string) {
  return supabase
    .from("tutor_profiles")
    .select(TUTOR_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
}

/** The caller's tutor profile, regardless of status. */
export async function getOwnTutorProfile(supabase: DB, userId: string) {
  return supabase
    .from("tutor_profiles")
    .select(TUTOR_DETAIL_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function createTutorProfile(
  supabase: DB,
  data: TutorProfileInsert,
) {
  return supabase.from("tutor_profiles").insert(data).select().single();
}

export async function updateTutorProfile(
  supabase: DB,
  id: string,
  patch: TutorProfileUpdate,
) {
  return supabase
    .from("tutor_profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
}

export async function archiveTutorProfile(supabase: DB, id: string) {
  return supabase
    .from("tutor_profiles")
    .update({ status: "archived" })
    .eq("id", id);
}

// ── session requests ──────────────────────────────────────────────────────

export async function createSessionRequest(
  supabase: DB,
  data: TutorSessionRequestInsert,
) {
  return supabase
    .from("tutor_session_requests")
    .insert(data)
    .select()
    .single();
}

export async function getRequestById(supabase: DB, id: string) {
  return supabase
    .from("tutor_session_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
}

export async function getIncomingRequests(supabase: DB, tutorUserId: string) {
  return supabase
    .from("tutor_session_requests")
    .select("*")
    .eq("tutor_user_id", tutorUserId)
    .order("created_at", { ascending: false });
}

export async function getOutgoingRequests(
  supabase: DB,
  learnerUserId: string,
) {
  return supabase
    .from("tutor_session_requests")
    .select("*")
    .eq("learner_user_id", learnerUserId)
    .order("created_at", { ascending: false });
}

export async function updateRequestStatus(
  supabase: DB,
  id: string,
  status: TutorRequestStatus,
  currentStatus?: TutorRequestStatus,
) {
  let q = supabase
    .from("tutor_session_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", id);
  if (currentStatus !== undefined) {
    q = q.eq("status", currentStatus) as typeof q;
  }
  return q.select().maybeSingle();
}
