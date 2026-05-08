"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

const DISMISS_KEY = "peerhelp:install-dismissed";
const DISMISS_DAYS = 30;

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  } | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled() || isDismissedRecently()) return;

    if (isIOS() && !isAlreadyInstalled()) {
      setShowIOSHint(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDeferredPrompt(e as any);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setVisible(false);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-2xl border border-neon-green/20 bg-forest shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-neon-green/10 overflow-hidden">
        {/* Glow accent */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-neon-green/[0.03]" />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Brand */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-neon-green/10 border border-neon-green/20">
              <span className="font-display text-sm font-bold text-neon-green select-none">
                P/
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                Install PeerHelp
              </p>
              {showIOSHint ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tap{" "}
                  <Share size={11} className="inline mb-0.5" />{" "}
                  then{" "}
                  <span className="text-foreground font-medium">
                    &ldquo;Add to Home Screen&rdquo;
                  </span>{" "}
                  to install.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Get the full app experience — offline support &amp; faster
                  loads.
                </p>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-overlay/5 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X size={14} />
            </button>
          </div>

          {!showIOSHint && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-neon-green text-void text-xs font-semibold py-2 hover:opacity-90 transition-opacity"
              >
                <Download size={12} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-overlay/10 bg-overlay/5 text-muted-foreground text-xs font-medium py-2 hover:text-foreground hover:border-overlay/20 transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
