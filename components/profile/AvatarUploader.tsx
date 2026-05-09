"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Camera, X, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/user-avatar";

interface AvatarUploaderProps {
  currentUrl: string | null;
  name: string | null;
  email: string;
}

function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        512,
        512,
      );
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        },
        "image/jpeg",
        0.9,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export function AvatarUploader({ currentUrl, name, email }: AvatarUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setModalOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setError(null);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const path = `${user.id}/avatar/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw new Error(updateError.message);

      setModalOpen(false);
      setImageSrc(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setModalOpen(false);
    setImageSrc(null);
    setError(null);
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Avatar with pencil overlay */}
      <button
        type="button"
        onClick={openFilePicker}
        className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/60 flex-shrink-0"
        aria-label="Change profile picture"
      >
        <UserAvatar
          src={currentUrl}
          name={name}
          email={email}
          size="xl"
          className="ring-2 ring-neon-green/20 ring-offset-2 ring-offset-forest"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={18} className="text-white" />
        </span>
      </button>

      {/* Crop modal */}
      {modalOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-overlay/10 bg-forest shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-overlay/10">
              <h2 className="text-sm font-semibold text-foreground">Crop Profile Picture</h2>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-lg text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Crop area */}
            <div className="relative h-72 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom slider */}
            <div className="px-5 pt-4 pb-2">
              <label className="text-[10px] uppercase tracking-widest text-shade-50 mb-1.5 block">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-neon-green"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="px-5 text-xs text-red-400">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-medium text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-green/15 border border-neon-green/30 text-xs font-semibold text-neon-green hover:bg-neon-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 size={12} className="animate-spin" /> Saving…</>
                ) : (
                  <><Check size={12} /> Save</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
