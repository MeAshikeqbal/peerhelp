"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IsbnScanner } from "@/components/listing/IsbnScanner";
import { createClient } from "@/lib/supabase/client";
import { ScanBarcode, Loader2, BookOpen, FileText, ImageIcon, X } from "lucide-react";
import Link from "next/link";

interface BookInfo {
  title: string;
  authors?: string;
  coverUrl: string;
  publishDate?: string;
}

type ListingType = "book" | "other";
type TransactionType = "sale" | "rental";
type ImageSource = "isbn-cover" | "manual" | null;

const MATERIAL_TYPE_OPTIONS = [
  { value: "notes", label: "Notes" },
  { value: "handouts", label: "Handouts" },
  { value: "pyq", label: "Past Year Papers" },
  { value: "other", label: "Other" },
];

export default function CreateListingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Listing type toggle
  const [listingType, setListingType] = useState<ListingType>("book");
  // Transaction type toggle (only for books)
  const [transactionType, setTransactionType] = useState<TransactionType>("sale");
  const [rentalPriceType, setRentalPriceType] = useState<"flat" | "per_day">("flat");
  const [securityDeposit, setSecurityDeposit] = useState("");

  // ISBN scanner
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image
  const [imageSource, setImageSource] = useState<ImageSource>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    condition: "good",
    price: "",
    hostel: "",
    department: "",
    year: "",
    description: "",
    isbn: "",
    material_type: "",
    subject: "",
  });

  // -- Image helpers ----------------------------------------------
  const clearImage = () => {
    if (imageSource === "manual" && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageSource(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED.includes(file.type)) {
      setError("Image must be a JPEG, PNG, or WebP file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size is 5 MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    if (imageSource === "manual" && imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageSource("manual");
    e.target.value = "";
  };

  // -- Type toggle ------------------------------------------------
  const handleTypeChange = (type: ListingType) => {
    if (type === listingType) return;
    setListingType(type);
    if (type === "other") {
      if (imageSource === "isbn-cover") clearImage();
      setBookInfo(null);
      setFormData((prev) => ({ ...prev, isbn: "" }));
      // Non-book listings cannot be rentals
      setTransactionType("sale");
    } else {
      setFormData((prev) => ({ ...prev, material_type: "" }));
    }
  };

  // -- ISBN lookup ------------------------------------------------
  const lookupIsbn = useCallback(async (raw: string) => {
    const clean = raw.replace(/[-\s]/g, "");
    if (!/^(\d{13}|\d{10}|\d{9}[Xx])$/.test(clean)) return;

    setIsLookingUp(true);
    setLookupError(null);
    setBookInfo(null);
    setCoverError(false);
    // Clear any previous ISBN cover when re-looking up
    setImageSource((prev) => (prev === "isbn-cover" ? null : prev));
    setImagePreviewUrl((prev) => {
      if (imageSource === "isbn-cover") return null;
      return prev;
    });

    try {
      const res = await fetch(`/api/books/lookup?isbn=${clean}`);
      if (!res.ok) {
        setLookupError("No book found. Fill in the title below.");
        return;
      }
      const data = (await res.json()) as BookInfo;
      setBookInfo(data);
      setFormData((prev) => ({ ...prev, title: data.title }));
      // Only auto-use the cover if user hasn't set their own image
      if (data.coverUrl) {
        setImageSource((prev) => (prev === "manual" ? prev : "isbn-cover"));
        setImagePreviewUrl((prev) => (imageSource === "manual" ? prev : data.coverUrl));
      }
    } catch {
      setLookupError("Could not look up book details.");
    } finally {
      setIsLookingUp(false);
    }
  }, [imageSource]);

  const handleIsbnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, isbn: val }));
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => lookupIsbn(val), 700);
  };

  const handleIsbnScanned = async (isbn: string) => {
    setShowScanner(false);
    setFormData((prev) => ({ ...prev, isbn }));
    await lookupIsbn(isbn);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setErrorCode(null);

    if (listingType === "other" && !formData.material_type) {
      setError("Please select a material type.");
      setIsSubmitting(false);
      return;
    }

    let image_url: string | null = null;

    try {
      if (imageSource === "isbn-cover" && imagePreviewUrl) {
        // Upload the external cover to our own storage so we own the URL
        setIsUploadingImage(true);
        const uploadRes = await fetch("/api/books/cover-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverUrl: imagePreviewUrl }),
        });
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.message ?? "Failed to upload cover image");
        }
        const { storageUrl } = await uploadRes.json();
        image_url = storageUrl;
      } else if (imageSource === "manual" && imageFile) {
        setIsUploadingImage(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(path, imageFile, {
            contentType: imageFile.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(path);
        image_url = publicUrl;
      }

      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          listing_type: listingType,
          material_type: listingType === "other" ? formData.material_type : null,
          subject: listingType === "other" ? (formData.subject.trim() || null) : null,
          image_url,
          transaction_type: transactionType,
          rental_price_type: transactionType === "rental" ? rentalPriceType : null,
          security_deposit: transactionType === "rental" ? securityDeposit : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create listing");
        setErrorCode(data.code ?? null);
        return;
      }
      router.push(`/dashboard/listings/${data.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  const inputCls =
    "h-10 bg-forest border-overlay/[0.08] text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-neon-green/40 focus-visible:border-neon-green/40 transition-colors";
  const selectCls =
    "h-10 w-full rounded-md border border-overlay/[0.08] bg-forest px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-green/40 focus:border-neon-green/40 transition-colors";

  const submitLabel = isUploadingImage
    ? "Uploading image…"
    : isSubmitting
    ? "Creating…"
    : "Create listing";

  const isRental = transactionType === "rental";
  const accentRing = isRental
    ? "ring-indigo-500/15 hover:ring-indigo-500/25"
    : "ring-overlay/[0.06] hover:ring-overlay/[0.1]";

  return (
    <>
      {showScanner && (
        <IsbnScanner
          onScan={handleIsbnScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-2xl pb-28 sm:pb-8"
      >
        {/* -- Page heading ----------------------------------------- */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Create a listing
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Share a book or study material with your campus.
          </p>
        </header>

        {/* -- Step 1: What you're listing -------------------------- */}
        <Section number={1} title="What are you listing?">
          {/* Type toggle (segmented) */}
          <div
            role="tablist"
            aria-label="Listing type"
            className="relative grid grid-cols-2 gap-1 rounded-xl border border-overlay/[0.08] bg-overlay/[0.02] p-1"
          >
            {(["book", "other"] as ListingType[]).map((type) => {
              const active = listingType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTypeChange(type)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-neon-green text-void shadow-[0_2px_12px_-3px_rgba(54,244,164,0.4)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-overlay/[0.04]"
                  }`}
                >
                  {type === "book" ? <BookOpen size={15} /> : <FileText size={15} />}
                  {type === "book" ? "Book" : "Notes & Materials"}
                </button>
              );
            })}
          </div>

          {/* Sale / Rent toggle (books only) */}
          {listingType === "book" && (
            <div
              role="tablist"
              aria-label="Transaction type"
              className="grid grid-cols-2 gap-1 rounded-xl border border-overlay/[0.08] bg-overlay/[0.02] p-1"
            >
              {(["sale", "rental"] as TransactionType[]).map((type) => {
                const active = transactionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTransactionType(type)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? type === "rental"
                          ? "bg-indigo-500 text-white shadow-[0_2px_12px_-3px_rgba(99,102,241,0.5)]"
                          : "bg-neon-green text-void shadow-[0_2px_12px_-3px_rgba(54,244,164,0.4)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-overlay/[0.04]"
                    }`}
                  >
                    {type === "sale" ? "For Sale" : "For Rent"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Helper hint */}
          <p className="text-xs text-muted-foreground/80">
            {listingType === "other"
              ? "Notes & materials are always sold (one-time purchase)."
              : isRental
              ? "Rentals collect a refundable deposit and return on a set date."
              : "Sell your book to a fellow student at a fair price."}
          </p>
        </Section>

        {/* -- Step 2: Photo + Details ------------------------------ */}
        <Section number={2} title="Photo & details">
          {/* Photo */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm font-medium text-foreground">Cover photo</Label>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Optional</span>
            </div>

            {imagePreviewUrl ? (
              <div className="overflow-hidden rounded-xl border border-overlay/[0.08] bg-overlay/[0.02]">
                <div className="relative aspect-[16/9] w-full bg-deep-teal">
                  <Image
                    src={imagePreviewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => {
                      if (imageSource === "isbn-cover") {
                        clearImage();
                        setCoverError(true);
                      }
                    }}
                  />
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                    <ImageIcon size={11} />
                    {imageSource === "isbn-cover" ? "Book cover" : "Custom photo"}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-overlay/[0.08] px-4 py-2.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {imageSource === "isbn-cover" ? "Auto-fetched from Open Library" : imageFile?.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <label className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-overlay/[0.06] hover:text-foreground">
                      Change
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-overlay/[0.12] bg-overlay/[0.02] px-6 py-10 transition-all hover:border-neon-green/40 hover:bg-neon-green/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-overlay/[0.06] transition-all group-hover:bg-neon-green/15 group-hover:scale-110">
                  <ImageIcon size={20} className="text-muted-foreground transition-colors group-hover:text-neon-green" />
                </div>
                <span className="text-sm font-medium text-foreground">Click to add a photo</span>
                <span className="text-xs text-muted-foreground/70">JPG, PNG, WEBP · up to 10 MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Book: ISBN scanner */}
          {listingType === "book" && (
            <div className={`space-y-3 rounded-xl border border-overlay/[0.08] bg-overlay/[0.02] p-4 ring-1 transition-all ${accentRing}`}>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="isbn" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ScanBarcode size={14} className="text-neon-green" />
                  ISBN lookup
                </Label>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Optional</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="isbn"
                  name="isbn"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 978-0-13-468599-1"
                  value={formData.isbn}
                  onChange={handleIsbnChange}
                  className={inputCls}
                />
                <Button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  variant="outline"
                  className="shrink-0 gap-2 border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:text-neon-green"
                >
                  <ScanBarcode size={16} />
                  Scan barcode
                </Button>
              </div>

              {isLookingUp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin text-neon-green" />
                  Looking up book…
                </div>
              )}

              {lookupError && !isLookingUp && (
                <p className="text-sm text-amber-400">{lookupError}</p>
              )}

              {bookInfo && !isLookingUp && (
                <div className="flex gap-3 rounded-lg border border-neon-green/25 bg-neon-green/[0.06] p-3">
                  {!coverError ? (
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-deep-teal shadow-md">
                      <Image
                        src={bookInfo.coverUrl}
                        alt={bookInfo.title}
                        fill
                        className="object-cover"
                        onError={() => setCoverError(true)}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-deep-teal">
                      <BookOpen size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 self-center">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {bookInfo.title}
                    </p>
                    {bookInfo.authors && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {bookInfo.authors}
                      </p>
                    )}
                    {bookInfo.publishDate && (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {bookInfo.publishDate}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other: material type + subject */}
          {listingType === "other" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="material_type" className="text-sm font-medium text-foreground">
                  Material type <span className="text-neon-green">*</span>
                </Label>
                <select
                  id="material_type"
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleInputChange}
                  required
                  className={selectCls}
                >
                  <option value="">Select type…</option>
                  {MATERIAL_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                    Subject
                  </Label>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Optional</span>
                </div>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="e.g. Engineering Maths II"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              {listingType === "book" ? "Book title" : "Title"} <span className="text-neon-green">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder={
                listingType === "book"
                  ? "e.g. Data Structures in C++"
                  : "e.g. Maths II Notes – Unit 3"
              }
              value={formData.title}
              onChange={handleInputChange}
              required
              className={inputCls}
            />
          </div>

          {/* Price + Condition */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-sm font-medium text-foreground">
                {isRental
                  ? rentalPriceType === "per_day"
                    ? "Rental / day"
                    : "Flat rental price"
                  : "Price"}{" "}
                <span className="text-neon-green">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/70">
                  ₹
                </span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="numeric"
                  placeholder="500"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className={`${inputCls} pl-7`}
                />
                {isRental && rentalPriceType === "per_day" && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                    /day
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="condition" className="text-sm font-medium text-foreground">
                Condition <span className="text-neon-green">*</span>
              </Label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={selectCls}
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          {/* Rental settings */}
          {isRental && (
            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300">
                  Rental settings
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Pricing model <span className="text-indigo-400">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-overlay/[0.08] bg-overlay/[0.02] p-1">
                  {(["flat", "per_day"] as const).map((type) => {
                    const active = rentalPriceType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRentalPriceType(type)}
                        className={`flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          active
                            ? "bg-indigo-500 text-white shadow-[0_2px_8px_-2px_rgba(99,102,241,0.5)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-overlay/[0.04]"
                        }`}
                      >
                        {type === "flat" ? "Flat rate" : "Per day"}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground/80">
                  {rentalPriceType === "flat"
                    ? "One fixed fee for the entire rental period."
                    : "Daily rate × number of days the book is rented."}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="security_deposit" className="text-sm font-medium text-foreground">
                  Security deposit <span className="text-indigo-400">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/70">
                    ₹
                  </span>
                  <Input
                    id="security_deposit"
                    name="security_deposit"
                    type="number"
                    inputMode="numeric"
                    placeholder="200"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    required={isRental}
                    min="0"
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Refunded in full when the book is returned in good condition.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Description
              </Label>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Optional</span>
            </div>
            <textarea
              id="description"
              name="description"
              placeholder={
                listingType === "book"
                  ? "Condition details, edition, markings, missing pages…"
                  : "What's covered, which subject, semester, page count…"
              }
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              className="resize-none rounded-md border border-overlay/[0.08] bg-forest px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-neon-green/40 focus:border-neon-green/40 transition-colors"
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-muted-foreground/60">
                {formData.description.length}/500
              </span>
            </div>
          </div>
        </Section>

        {/* -- Step 3: Pickup & campus ------------------------------ */}
        <Section number={3} title="Pickup & campus info">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="hostel" className="text-sm font-medium text-foreground">
                  Hostel
                </Label>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Optional</span>
              </div>
              <Input
                id="hostel"
                name="hostel"
                type="text"
                placeholder="e.g. A1"
                value={formData.hostel}
                onChange={handleInputChange}
                className={inputCls}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year" className="text-sm font-medium text-foreground">
                Year of study <span className="text-neon-green">*</span>
              </Label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
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

          <div className="grid gap-2">
            <Label htmlFor="department" className="text-sm font-medium text-foreground">
              Department <span className="text-neon-green">*</span>
            </Label>
            <Input
              id="department"
              name="department"
              type="text"
              placeholder="e.g. Computer Science"
              value={formData.department}
              onChange={handleInputChange}
              required
              className={inputCls}
            />
          </div>
        </Section>

        {/* -- Error banner ----------------------------------------- */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-bold text-red-300">
              !
            </span>
            <div className="leading-relaxed">
              {errorCode === "phone_required" ? (
                <>
                  A phone number is required to post listings.{" "}
                  <Link
                    href="/dashboard/profile"
                    className="font-medium underline underline-offset-2 hover:text-red-200 transition-colors"
                  >
                    Add one in your profile →
                  </Link>
                </>
              ) : (
                error
              )}
            </div>
          </div>
        )}

        {/* -- Sticky submit footer (mobile) + inline (desktop) ----- */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-overlay/[0.08] bg-background/85 px-4 py-3 backdrop-blur-md sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-neon-green font-semibold text-void shadow-[0_4px_20px_-4px_rgba(54,244,164,0.5)] hover:bg-neon-green/90 hover:shadow-[0_4px_24px_-4px_rgba(54,244,164,0.65)] disabled:opacity-60 disabled:shadow-none transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {submitLabel}
                </>
              ) : (
                "Create listing"
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper — numbered, consistent spacing, themed surface     */
/* ------------------------------------------------------------------ */
function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-overlay/[0.07] bg-overlay/[0.02] p-5 sm:p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neon-green/30 bg-neon-green/10 text-xs font-bold text-neon-green">
          {number}
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
