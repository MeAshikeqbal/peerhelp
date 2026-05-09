"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const AvatarUploader = dynamic(
  () => import("@/components/profile/AvatarUploader").then((m) => m.AvatarUploader),
  { ssr: false, loading: () => <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shrink-0" /> },
);

export const NotificationPrefsForm = dynamic(
  () => import("@/components/profile/NotificationPrefsForm").then((m) => m.NotificationPrefsForm),
  { ssr: false, loading: () => <div className="px-6 py-4"><Skeleton className="h-5 w-full" /></div> },
);

export const BlockedUsersList = dynamic(
  () => import("@/components/profile/BlockedUsersList").then((m) => m.BlockedUsersList),
  { ssr: false, loading: () => <div className="px-6 py-4"><Skeleton className="h-5 w-48" /></div> },
);

export const PushSubscribeButton = dynamic(
  () => import("@/components/pwa/PushSubscribeButton").then((m) => m.PushSubscribeButton),
  { ssr: false, loading: () => <div className="px-6 py-4"><Skeleton className="h-9 w-40" /></div> },
);
