"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Allow opt-in during local dev via NEXT_PUBLIC_SW_ENABLED=true
    const swEnabled =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SW_ENABLED === "true";
    if (!swEnabled) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // Only prompt when the new worker is fully active and there was
            // an existing controller (not the very first install).
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // SW registration is best-effort — fail silently
      });
  }, []);

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-overlay/10 bg-forest px-4 py-3 shadow-lg text-sm text-foreground">
      <RefreshCw size={14} className="shrink-0 text-neon-green" />
      <span>A new version is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="font-medium text-neon-green hover:underline"
      >
        Reload
      </button>
      <button
        onClick={() => setUpdateReady(false)}
        className="ml-1 text-shade-50 hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
