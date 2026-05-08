"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IsbnScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export function IsbnScanner({ onScan, onClose }: IsbnScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    let mounted = true;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (!mounted) return;
        if (result) {
          const text = result.getText();
          // Accept EAN-13 ISBN (978/979 prefix) or ISBN-10
          if (/^97[89]\d{10}$/.test(text) || /^\d{9}[\dXx]$/.test(text)) {
            controlsRef.current?.stop();
            onScan(text);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          setError("Camera error. Please check permissions and try again.");
        }
      })
      .then((controls) => {
        if (mounted) controlsRef.current = controls;
      })
      .catch(() => {
        if (mounted) setError("Could not access camera. Please allow camera permissions.");
      });

    return () => {
      mounted = false;
      controlsRef.current?.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-inverse/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-[20px] border border-border bg-deep-teal p-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close scanner"
        >
          <X size={20} />
        </button>

        <h2 className="mb-1 font-display text-lg text-foreground">Scan ISBN</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Point the camera at the barcode on the back cover
        </p>

        {error ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl bg-overlay-inverse">
              <video
                ref={videoRef}
                className="w-full rounded-xl"
                style={{ aspectRatio: "4/3", objectFit: "cover" }}
              />
              {/* Scan guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-64 rounded border-2 border-neon-green/70 shadow-[0_0_12px_rgba(54,244,164,0.3)]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
