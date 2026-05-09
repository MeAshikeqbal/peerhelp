"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ImagePlus, Trash2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EditListingFormProps {
  listing: {
    id: string;
    title: string;
    condition: string;
    price: number;
    hostel: string | null;
    department: string | null;
    year_of_study: number | null;
    description: string | null;
    subject: string | null;
    listing_type: string;
    material_type: string | null;
    status: string;
    image_url: string | null;
    transaction_type?: string;
    rental_price_type?: string | null;
    security_deposit?: number | null;
  };
  isLocked: boolean;
}

const selectCls =
  "h-10 w-full rounded-md border border-border bg-forest px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30 disabled:cursor-not-allowed disabled:opacity-60";
const inputCls =
  "bg-forest border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-neon-green/30 disabled:cursor-not-allowed disabled:opacity-60";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function LockedHint() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Lock size={11} />
      Locked while a deal is active
    </span>
  );
}

export default function EditListingForm({ listing, isLocked }: EditListingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: listing.title,
    condition: listing.condition,
    price: String(listing.price),
    hostel: listing.hostel ?? "",
    department: listing.department ?? "",
    year: listing.year_of_study ? String(listing.year_of_study) : "",
    description: listing.description ?? "",
    subject: listing.subject ?? "",
  });

  // Image state — only mutable when !isLocked
  const [imageUrl, setImageUrl] = useState<string | null>(listing.image_url);
  const [imageDirty, setImageDirty] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5MB or less.");
      return;
    }

    try {
      setIsUploading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(path);

      setImageUrl(publicUrl);
      setImageDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleImageRemove() {
    setImageUrl(null);
    setImageDirty(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Always-editable fields.
      const payload: Record<string, unknown> = {
        hostel: formData.hostel || null,
        department: formData.department || null,
        year: formData.year || null,
        description: formData.description || null,
      };

      // Only include locked fields when not locked.
      if (!isLocked) {
        payload.title = formData.title;
        payload.condition = formData.condition;
        payload.price = formData.price;
        payload.subject =
          listing.listing_type === "other" ? formData.subject || null : null;
        if (imageDirty) payload.image_url = imageUrl;
      }

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update listing");
        return;
      }
      router.push(`/dashboard/listings/${listing.id}`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showSubject = listing.listing_type === "other";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">
          {isLocked ? "Edit pickup info" : "Edit listing"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLocked
            ? "There's an open request on this listing. Pickup details remain editable."
            : "Update your listing details"}
        </p>
      </div>

      {isLocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            There's an open request on this listing. You can still update{" "}
            <span className="font-medium">description, pickup hostel, department, year</span>
            . Other details are locked to protect the buyer.
          </p>
        </div>
      )}

      {/* Cover photo */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-foreground">Cover photo</Label>
          {isLocked && <LockedHint />}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-forest">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Cover preview"
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {!isLocked && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleImagePick}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImagePlus size={14} />
                )}
                {imageUrl ? "Change" : "Upload"}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleImageRemove}
                  className="gap-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                JPEG, PNG, or WebP · max 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title" className="text-foreground">Title *</Label>
          {isLocked && <LockedHint />}
        </div>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={isLocked}
          className={inputCls}
        />
      </div>

      {/* Price + Condition */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="price" className="text-foreground">Price (₹) *</Label>
            {isLocked && <LockedHint />}
          </div>
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            disabled={isLocked}
            className={inputCls}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="condition" className="text-foreground">Condition *</Label>
            {isLocked && <LockedHint />}
          </div>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            disabled={isLocked}
            className={selectCls}
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="used">Used</option>
          </select>
        </div>
      </div>

      {/* Hostel + Year (always editable) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="hostel" className="text-foreground">Hostel</Label>
          <Input
            id="hostel"
            name="hostel"
            type="text"
            placeholder="e.g. A1"
            value={formData.hostel}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="year" className="text-foreground">Year</Label>
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className={selectCls}
          >
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* Department (always editable) */}
      <div className="grid gap-2">
        <Label htmlFor="department" className="text-foreground">Department</Label>
        <Input
          id="department"
          name="department"
          type="text"
          placeholder="e.g. Computer Science"
          value={formData.department}
          onChange={handleChange}
          className={inputCls}
        />
      </div>

      {/* Subject (study materials only) */}
      {showSubject && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subject" className="text-foreground">
              Subject{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            {isLocked && <LockedHint />}
          </div>
          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="e.g. Engineering Maths II"
            value={formData.subject}
            onChange={handleChange}
            disabled={isLocked}
            className={inputCls}
          />
        </div>
      )}

      {/* Rental info (read-only badge) */}
      {listing.transaction_type === "rental" && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-400">Rental listing</p>
          <div className="flex flex-wrap gap-4 text-sm text-foreground">
            <span>
              <span className="text-muted-foreground">Pricing: </span>
              {listing.rental_price_type === "per_day" ? "Per day" : "Flat rate"}
            </span>
            {listing.security_deposit != null && (
              <span>
                <span className="text-muted-foreground">Deposit: </span>
                ₹{listing.security_deposit}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Transaction type cannot be changed after creation.</p>
        </div>
      )}

      {/* Description (always editable) */}
      <div className="grid gap-2">
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="rounded-md border border-border bg-forest px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/30 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/dashboard/listings/${listing.id}`)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 bg-neon-green text-void hover:bg-neon-green/90 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
