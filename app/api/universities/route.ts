import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCollegeDirectory as searchCollegeDirectoryLocal } from "@/lib/college-directory";
import { searchCollegeDirectory } from "@/utils/query/universities";

// Simple in-memory cache and rate-limiter.
// Notes: This is process-local and best-effort. For production, use Redis or an external store.
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
const cache = new Map<string, { data: Array<{ name: string; country: string; web_pages: string[] }>; expires: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per IP per window
const rateMap = new Map<string, { count: number; reset: number }>();

function getClientIp(request: Request) {
  const xfwd = request.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function cacheResponse(key: string, data: Array<{ name: string; country: string; web_pages: string[] }>) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

function mapRowsToSuggestions(rows: Array<{ college_name: string }>) {
  return rows.map((row) => ({
    name: row.college_name,
    country: "India",
    web_pages: [],
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([], { status: 200 });

  // rate-limit by IP
  try {
    const ip = getClientIp(request);
    const now = Date.now();
    const prev = rateMap.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW };
    if (now > prev.reset) {
      prev.count = 0;
      prev.reset = now + RATE_LIMIT_WINDOW;
    }
    prev.count += 1;
    rateMap.set(ip, prev);
    if (prev.count > RATE_LIMIT_MAX) {
      return new Response("Too Many Requests", { status: 429 });
    }
  } catch {
    // swallow rate limiter failures
  }

  const key = q.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: { "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL / 1000)}` },
    });
  }

  try {
    const supabase = await createClient();

    const { data: tableRows, error } = await searchCollegeDirectory(supabase, q, 8);

    let unique: Array<{ name: string; country: string; web_pages: string[] }> = [];

    if (!error && tableRows && tableRows.length > 0) {
      unique = mapRowsToSuggestions(tableRows as Array<{ college_name: string }>);
    } else {
      const localMatches = await searchCollegeDirectoryLocal(q, 8);
      unique = localMatches.map((row) => ({
        name: row.name,
        country: row.country,
        web_pages: row.web_pages,
      }));
    }

    cacheResponse(key, unique);

    return NextResponse.json(unique, {
      status: 200,
      headers: { "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL / 1000)}` },
    });
  } catch {
    const fallback = (await searchCollegeDirectoryLocal(q, 8)).map((row) => ({
      name: row.name,
      country: row.country,
      web_pages: row.web_pages,
    }));

    cacheResponse(key, fallback);

    return NextResponse.json(fallback, {
      status: 200,
      headers: { "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL / 1000)}` },
    });
  }
}
