import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getListingById, updateListing } from "@/utils/query/listings";
import { hasBlockingDeal } from "@/utils/query/deals";
import { validateImageUrl } from "@/lib/listing-image";

/**
 * Fields that are locked once the listing has an accepted or completed deal,
 * or once the listing itself transitions to `sold`/`reserved`. These represent
 * what the buyer agreed to and must not change underneath them.
 */
type LockedField =
  | "title"
  | "condition"
  | "price"
  | "image_url"
  | "material_type"
  | "subject";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await getListingById(supabase, id);
    if (!existing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }
    if (existing.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
      subject,
      status,
      image_url,
      material_type,
    } = body;

    // Partial-lock state: any binding deal or sold/reserved status freezes
    // identity-defining fields. Pickup/logistics fields stay editable.
    const statusLocked =
      existing.status === "sold" || existing.status === "reserved";
    const dealLocked = await hasBlockingDeal(supabase, id);
    const isLocked = statusLocked || dealLocked;

    if (isLocked) {
      const submittedLocked: LockedField[] = [];
      if (title !== undefined) submittedLocked.push("title");
      if (condition !== undefined) submittedLocked.push("condition");
      if (price !== undefined) submittedLocked.push("price");
      if (image_url !== undefined) submittedLocked.push("image_url");
      if (material_type !== undefined) submittedLocked.push("material_type");
      if (subject !== undefined) submittedLocked.push("subject");

      if (submittedLocked.length > 0) {
        return NextResponse.json(
          {
            message:
              "This listing has an active deal. Some details are locked to protect the buyer.",
            code: "listing_locked",
            lockedFields: submittedLocked,
          },
          { status: 423 }
        );
      }
    }

    const update: Record<string, unknown> = {};

    if (!isLocked) {
      if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
          return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });
        }
        update.title = title.trim().slice(0, 500);
      }

      if (condition !== undefined) {
        if (!["new", "good", "used"].includes(condition)) {
          return NextResponse.json({ message: "Invalid condition" }, { status: 400 });
        }
        update.condition = condition;
      }

      if (price !== undefined) {
        const priceInt = parseInt(price, 10);
        if (isNaN(priceInt) || priceInt < 0) {
          return NextResponse.json({ message: "Invalid price" }, { status: 400 });
        }
        update.price = priceInt;
      }

      if (image_url !== undefined) {
        if (image_url === null) {
          update.image_url = null;
        } else if (typeof image_url === "string" && image_url) {
          const imgErr = validateImageUrl(image_url, user.id);
          if (imgErr) {
            return NextResponse.json({ message: imgErr }, { status: 400 });
          }
          update.image_url = image_url;
        } else {
          return NextResponse.json({ message: "Invalid image_url" }, { status: 400 });
        }
      }

      if (subject !== undefined) {
        update.subject =
          typeof subject === "string" ? subject.trim().slice(0, 200) || null : null;
      }

      if (material_type !== undefined) {
        if (
          material_type !== null &&
          !["notes", "handouts", "pyq", "other"].includes(material_type)
        ) {
          return NextResponse.json(
            { message: "Invalid material_type" },
            { status: 400 }
          );
        }
        update.material_type = material_type ?? null;
      }
    }

    // Always-editable fields (work even when locked).
    if (hostel !== undefined) update.hostel = hostel;
    if (department !== undefined) update.department = department;

    if (year !== undefined) {
      const yearInt = parseInt(year, 10);
      if (isNaN(yearInt) || yearInt < 1 || yearInt > 8) {
        return NextResponse.json({ message: "Invalid year" }, { status: 400 });
      }
      update.year_of_study = yearInt;
    }

    if (description !== undefined) {
      update.description =
        typeof description === "string" ? description.trim() || null : null;
    }

    if (status !== undefined) {
      if (!["active", "sold", "cancelled"].includes(status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      }
      update.status = status;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const { data: listing, error: updateError } = await updateListing(supabase, id, update);

    if (updateError) {
      console.error("Listing update error:", updateError);
      return NextResponse.json({ message: "Failed to update listing" }, { status: 500 });
    }

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("PATCH /api/listings/[id] error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
