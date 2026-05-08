"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_BYTES = 5 * 1024 * 1024;

export function IdDocumentUpload({
  hasExisting = false,
}: {
  hasExisting?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, or PDF files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be 5MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      // 1. Request signed upload URL
      setProgress("Preparing upload…");
      const urlRes = await fetch("/api/student-verification/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!urlRes.ok) {
        const j = await urlRes.json().catch(() => ({}));
        throw new Error(j.message ?? "Could not start upload");
      }
      const { path, token, bucket, verificationId } = await urlRes.json();

      // 2. Upload to Supabase Storage via signed URL
      setProgress("Uploading…");
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message);

      // 3. Confirm
      setProgress("Finalizing…");
      const confirmRes = await fetch(
        "/api/student-verification/upload-document/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, verificationId }),
        },
      );
      if (!confirmRes.ok) {
        const j = await confirmRes.json().catch(() => ({}));
        throw new Error(j.message ?? "Upload validation failed");
      }

      setProgress("Submitted");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={onSelect}
        disabled={busy}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {busy
          ? (progress ?? "Uploading…")
          : hasExisting
            ? "Replace document"
            : "Upload student ID"}
      </button>
      <p className="text-xs text-shade-50">
        Accepted: JPG, PNG, WEBP, or PDF. Max 5MB. Documents are deleted within
        24 hours of a decision.
      </p>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
