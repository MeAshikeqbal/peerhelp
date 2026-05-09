/**
 * Client-side Web Push helpers.
 * Only import this file from "use client" components.
 */

/** Convert VAPID public key (URL-safe base64) to Uint8Array for pushManager.subscribe */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function subscribeUserToPush(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("VAPID public key not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY)");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // Ensure a service worker is registered — register on-demand if missing.
  // Do NOT swallow errors here: if registration fails and no active SW exists,
  // navigator.serviceWorker.ready would hang forever.
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }

  const registration = await navigator.serviceWorker.ready;

  // If a subscription already exists (potentially from a different VAPID key),
  // unsubscribe it first. Keeping a stale subscription causes:
  //   AbortError: Registration failed - push service error
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    await existingSub.unsubscribe();
  }

  // Pass the Uint8Array directly — using .buffer risks passing a larger shared
  // ArrayBuffer with an offset, which the push service rejects.
  // Cast to Uint8Array<ArrayBuffer>: new Uint8Array() always allocates a plain
  // ArrayBuffer, but TypeScript infers ArrayBufferLike which doesn't satisfy
  // the DOM's ArrayBufferView<ArrayBuffer> constraint on applicationServerKey.
  const keyBytes = urlBase64ToUint8Array(publicKey) as Uint8Array<ArrayBuffer>;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes,
  });

  const { endpoint, keys } = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) throw new Error("Failed to save push subscription");
}

export async function unsubscribeUserFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
  } catch (err) {
    console.warn("unsubscribeUserFromPush failed:", err);
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
