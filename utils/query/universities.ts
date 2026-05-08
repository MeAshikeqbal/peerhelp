import type { DB } from "./_db";

/** Full-text search across the college directory. */
export async function searchCollegeDirectory(
  supabase: DB,
  q: string,
  limit = 20,
) {
  const pattern = `%${q}%`;
  return supabase
    .from("college_directory")
    .select("college_name")
    .or(
      [
        `college_name.ilike.${pattern}`,
        `university_name.ilike.${pattern}`,
        `college_type.ilike.${pattern}`,
        `state_name.ilike.${pattern}`,
        `district_name.ilike.${pattern}`,
      ].join(","),
    )
    .limit(limit);
}
