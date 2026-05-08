import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import type { DB } from "./_db";

export type Listing = Tables<"listings">;
export type ListingInsert = TablesInsert<"listings">;
export type ListingUpdate = TablesUpdate<"listings">;

type ListingsRow = Database["public"]["Tables"]["listings"]["Row"];
type Condition = ListingsRow["condition"];
type TransactionType = ListingsRow["transaction_type"];
type ListingType = ListingsRow["listing_type"];

const VALID_CONDITIONS: readonly Condition[] = ["new", "good", "used"] as const;
const VALID_TX_TYPES: readonly TransactionType[] = ["sale", "rental"] as const;
const VALID_LISTING_TYPES: readonly ListingType[] = ["book", "other"] as const;

export interface ListingFilters {
  q?: string;
  type?: string;
  condition?: string;
  hostel?: string;
  department?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Filter by transaction type: 'sale' | 'rental' */
  transaction_type?: string;
  /** Pass an array of user ids to restrict results to those sellers. */
  peerIds?: string[];
  page?: number;
  pageSize?: number;
}

/**
 * Paginated active-listings query with optional filters.
 * Returns `{ data, count, error }`.
 */
export async function getActiveListings(
  supabase: DB,
  filters: ListingFilters = {},
) {
  const pageSize = filters.pageSize ?? 12;
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.type && (VALID_LISTING_TYPES as readonly string[]).includes(filters.type)) {
    query = query.eq("listing_type", filters.type as ListingType);
  }
  if (filters.transaction_type && (VALID_TX_TYPES as readonly string[]).includes(filters.transaction_type)) {
    query = query.eq("transaction_type", filters.transaction_type as TransactionType);
  }
  if (filters.condition && (VALID_CONDITIONS as readonly string[]).includes(filters.condition)) {
    query = query.eq("condition", filters.condition as Condition);
  }
  if (filters.hostel) query = query.ilike("hostel", `%${filters.hostel}%`);
  if (filters.department) query = query.ilike("department", `%${filters.department}%`);
  if (filters.year) query = query.eq("year_of_study", filters.year);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  if (filters.peerIds !== undefined) {
    if (filters.peerIds.length > 0) {
      query = query.in("user_id", filters.peerIds);
    } else {
      // No peers found — return zero results without a full table scan.
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  return query.range(offset, offset + pageSize - 1);
}

/** Fetch a single listing by id. */
export async function getListingById(
  supabase: DB,
  id: string,
) {
  return supabase
    .from("listings")
    .select(
      "id, user_id, title, isbn, condition, price, hostel, department, year_of_study, description, status, created_at, image_url, listing_type, material_type, subject, transaction_type, rental_price_type, security_deposit",
    )
    .eq("id", id)
    .single();
}

/** Count all listings owned by a user. */
export async function countUserListings(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
}

/** Batch fetch listings by id array (used in deals page). */
export async function getListingsByIds(
  supabase: DB,
  ids: string[],
) {
  return supabase
    .from("listings")
    .select("id, title, price, condition, transaction_type, rental_price_type, security_deposit, image_url")
    .in("id", ids);
}

/** Insert a new listing. */
export async function createListing(
  supabase: DB,
  data: ListingInsert,
) {
  return supabase.from("listings").insert(data).select().single();
}

/** Update allowed listing fields. */
export async function updateListing(
  supabase: DB,
  id: string,
  patch: ListingUpdate,
) {
  return supabase.from("listings").update(patch).eq("id", id);
}

/** All listings owned by a user, sorted newest-first. */
export async function getUserListings(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("listings")
    .select(
      "id, title, condition, price, status, created_at, image_url, listing_type, department, transaction_type, rental_price_type",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

/** Active listings for a seller public profile page. */
export async function getSellerActiveListings(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("listings")
    .select("id, title, condition, price, image_url, listing_type, department")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);
}
