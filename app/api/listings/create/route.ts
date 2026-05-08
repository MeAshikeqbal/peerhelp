import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getOwnPhone } from "@/utils/query/profiles";
import { createListing } from "@/utils/query/listings";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateImageUrl } from "@/lib/listing-image";

const LISTING_CREATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LISTING_CREATE_MAX = 20;

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
      "listing_create",
      LISTING_CREATE_MAX,
      LISTING_CREATE_WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "You're creating listings too quickly. Please wait and try again.",
          retryAfter: rate.retryAfter,
          nextRetryAt: rate.nextRetryAt,
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
      );
    }

    // Check if user is verified
    const { data: profile } = await getVerificationStatus(supabase, user.id);

    if (profile?.verification_status !== "verified") {
      return NextResponse.json(
        { message: "You must be verified to create listings" },
        { status: 403 }
      );
    }

    // Phone number is required to post listings
    const { data: phone } = await getOwnPhone(supabase);
    if (!phone) {
      return NextResponse.json(
        {
          message: "A phone number is required to post listings. Please add one in your profile.",
          code: "phone_required",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      condition,
      price,
      hostel,
      department,
      year,
      description,
      isbn,
      image_url,
      listing_type,
      material_type,
      subject,
      transaction_type,
      rental_price_type,
      security_deposit,
    } = body;

    const type: string = listing_type || "book";
    if (!["book", "other"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid listing_type" },
        { status: 400 }
      );
    }

    if (type === "other" && !material_type) {
      return NextResponse.json(
        { message: "Material type is required for non-book listings" },
        { status: 400 }
      );
    }

    const txType: string = transaction_type || "sale";
    if (!["sale", "rental"].includes(txType)) {
      return NextResponse.json(
        { message: "Invalid transaction_type" },
        { status: 400 }
      );
    }

    // Only books can be rentals
    if (txType === "rental" && type !== "book") {
      return NextResponse.json(
        { message: "Only book listings can be rental listings" },
        { status: 400 }
      );
    }

    // Rental listings require price type and security deposit
    if (txType === "rental") {
      if (!rental_price_type || !["flat", "per_day"].includes(rental_price_type)) {
        return NextResponse.json(
          { message: "rental_price_type must be 'flat' or 'per_day' for rental listings" },
          { status: 400 }
        );
      }
      const deposit = parseFloat(security_deposit);
      if (isNaN(deposit) || deposit < 0) {
        return NextResponse.json(
          { message: "Invalid security_deposit" },
          { status: 400 }
        );
      }
    }

    // Validation (hostel is optional)
    if (!title || !condition || !price || !department || !year) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // String field bounds — reject oversized payloads early
    const FIELD_LIMITS: Record<string, number> = {
      title: 200,
      description: 2000,
      hostel: 100,
      department: 100,
      subject: 200,
      isbn: 20,
      material_type: 50,
    };
    const stringFields = { title, description, hostel, department, subject, isbn, material_type };
    for (const [key, raw] of Object.entries(stringFields)) {
      if (raw === undefined || raw === null) continue;
      if (typeof raw !== "string") {
        return NextResponse.json({ message: `${key} must be a string` }, { status: 400 });
      }
      if (raw.length > FIELD_LIMITS[key]) {
        return NextResponse.json(
          { message: `${key} must be at most ${FIELD_LIMITS[key]} characters` },
          { status: 400 }
        );
      }
    }

    if (!["new", "good", "used"].includes(condition)) {
      return NextResponse.json(
        { message: "Invalid condition value" },
        { status: 400 }
      );
    }

    const priceInt = parseInt(price, 10);
    if (isNaN(priceInt) || priceInt < 0 || priceInt > 1_000_000) {
      return NextResponse.json(
        { message: "Price must be between 0 and 1,000,000" },
        { status: 400 }
      );
    }

    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt) || yearInt < 1 || yearInt > 8) {
      return NextResponse.json(
        { message: "Year must be between 1 and 8" },
        { status: 400 }
      );
    }

    // Cap rental security deposit
    if (txType === "rental") {
      const deposit = parseFloat(security_deposit);
      if (deposit > 1_000_000) {
        return NextResponse.json(
          { message: "Security deposit must be at most 1,000,000" },
          { status: 400 }
        );
      }
    }

    // Validate image_url, if provided
    if (image_url) {
      const imgErr = validateImageUrl(String(image_url), user.id);
      if (imgErr) {
        return NextResponse.json({ message: imgErr }, { status: 400 });
      }
    }

    // Create listing
    const { data: listing, error: listingError } = await createListing(supabase, {
        user_id: user.id,
        title,
        condition,
        price: priceInt,
        hostel: typeof hostel === "string" ? (hostel.trim() || null) : null,
        department,
        year_of_study: yearInt,
        description: description || null,
        isbn: type === "book" ? (isbn || null) : null,
        status: "active",
        image_url: image_url || null,
        listing_type: type,
        material_type: type === "other" ? (material_type || null) : null,
        subject: type === "other" ? (typeof subject === "string" ? subject.trim().slice(0, 200) || null : null) : null,
        transaction_type: txType,
        rental_price_type: txType === "rental" ? rental_price_type : null,
        security_deposit: txType === "rental" ? parseFloat(security_deposit) : null,
      });

    if (listingError) {
      console.error("Listing creation error:", listingError);
      return NextResponse.json(
        { message: "Failed to create listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
